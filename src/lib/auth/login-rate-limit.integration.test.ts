// @vitest-environment node
// The throttle tables live in the local Docker database (rule 2). Every limiter here uses its own
// namespace under RUN, so runs never collide with each other or with the app's "login"/"reset" rows.
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../db";
import { isLocalDatabase } from "../is-local-database";
import { createLoginRateLimiter } from "./login-rate-limit";

const local = isLocalDatabase(process.env.DATABASE_URL);
const RUN = `t14-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const MINUTE = 60_000;
const WINDOW = 15 * MINUTE;
const T0 = Date.UTC(2026, 10, 24, 12, 0, 0);

let seq = 0;
function limiter(options: { maxPerAccount?: number; maxPerIp?: number; cleanupEveryMs?: number } = {}) {
  const namespace = `${RUN}-${seq++}`;
  return {
    namespace,
    limiter: createLoginRateLimiter({
      namespace,
      windowMs: WINDOW,
      maxPerAccount: options.maxPerAccount ?? 5,
      maxPerIp: options.maxPerIp ?? 20,
      // Cleanup only when a test asks for it, so rows stay put while a test inspects them.
      cleanupEveryMs: options.cleanupEveryMs ?? Number.POSITIVE_INFINITY,
    }),
  };
}

const row = (key: string) => db.authThrottle.findUnique({ where: { key } });

describe.skipIf(!local)("login rate limiter (Postgres)", () => {
  afterAll(async () => {
    await db.authThrottle.deleteMany({ where: { key: { startsWith: RUN } } });
  });

  it("allows attempts until the per-account limit is reached, then reports the whole window", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 5; i++) {
      expect((await l.check("1.1.1.1", "a@x.com", T0)).allowed).toBe(true);
      await l.recordFailure("1.1.1.1", "a@x.com", T0);
    }
    expect(await l.check("1.1.1.1", "a@x.com", T0)).toEqual({ allowed: false, retryAfterSeconds: 15 * 60 });
  });

  it("keeps the account locked when the attacker changes IP, and treats the email case-insensitively", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 5; i++) await l.recordFailure(`10.0.0.${i}`, "A@X.com", T0);
    expect((await l.check("10.9.9.9", "a@x.com", T0)).allowed).toBe(false);
  });

  it("locks one IP across many accounts, and only that IP", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 20; i++) await l.recordFailure("2.2.2.2", `user${i}@x.com`, T0);
    expect((await l.check("2.2.2.2", "fresh@x.com", T0)).allowed).toBe(false);
    expect((await l.check("3.3.3.3", "fresh@x.com", T0)).allowed).toBe(true);
  });

  it("starts a new window once the previous one has passed", async () => {
    const { namespace, limiter: l } = limiter();
    for (let i = 0; i < 4; i++) await l.recordFailure("1.1.1.1", "a@x.com", T0);
    const next = T0 + WINDOW;
    await l.recordFailure("1.1.1.1", "a@x.com", next);

    // The four old failures are gone: the window restarts at the new failure with a count of one.
    expect(await row(`${namespace}:acct:a@x.com`)).toMatchObject({ failures: 1, windowStart: new Date(next), lockedUntil: null });
    for (let i = 0; i < 3; i++) await l.recordFailure("1.1.1.1", "a@x.com", next + 1);
    expect((await l.check("1.1.1.1", "a@x.com", next + 1)).allowed).toBe(true);
    await l.recordFailure("1.1.1.1", "a@x.com", next + 2);
    expect(await l.check("1.1.1.1", "a@x.com", next + 2)).toEqual({ allowed: false, retryAfterSeconds: 15 * 60 });
  });

  it("lifts the lock exactly when the window ends", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 5; i++) await l.recordFailure("1.1.1.1", "a@x.com", T0);
    expect(await l.check("1.1.1.1", "a@x.com", T0 + WINDOW - 1)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(await l.check("1.1.1.1", "a@x.com", T0 + WINDOW)).toEqual({ allowed: true });
  });

  it("reports the later unlock when both the account and the address are locked, and that wait is the real one", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 20; i++) await l.recordFailure("2.2.2.2", `user${i}@x.com`, T0);
    for (let i = 0; i < 5; i++) await l.recordFailure(`10.0.0.${i}`, "target@x.com", T0 + 5 * MINUTE);

    // The address unlocks at minute 15, the account at minute 20.
    const asked = T0 + 5 * MINUTE + 12_300;
    const answer = await l.check("2.2.2.2", "target@x.com", asked);
    expect(answer).toEqual({ allowed: false, retryAfterSeconds: 888 });
    if (answer.allowed) throw new Error("unreachable");
    expect((await l.check("2.2.2.2", "target@x.com", asked + answer.retryAfterSeconds * 1000 - 1000)).allowed).toBe(false);
    expect((await l.check("2.2.2.2", "target@x.com", asked + answer.retryAfterSeconds * 1000)).allowed).toBe(true);
  });

  it("counts concurrent failures exactly and locks exactly at the limit", async () => {
    const { namespace, limiter: l } = limiter({ maxPerAccount: 40, maxPerIp: 10_000 });
    await Promise.all(Array.from({ length: 39 }, () => l.recordFailure("4.4.4.4", "race@x.com", T0)));
    expect(await row(`${namespace}:acct:race@x.com`)).toMatchObject({ failures: 39, lockedUntil: null });
    expect((await l.check("4.4.4.4", "race@x.com", T0)).allowed).toBe(true);

    await l.recordFailure("4.4.4.4", "race@x.com", T0);
    expect(await row(`${namespace}:acct:race@x.com`)).toMatchObject({ failures: 40, lockedUntil: new Date(T0 + WINDOW) });
    expect((await l.check("4.4.4.4", "race@x.com", T0)).allowed).toBe(false);

    await Promise.all(Array.from({ length: 100 }, (_, i) => l.recordFailure("4.4.4.4", `burst${i % 3}@x.com`, T0)));
    expect((await row(`${namespace}:ip:4.4.4.4`))?.failures).toBe(140);
    const burst = await Promise.all([0, 1, 2].map((i) => row(`${namespace}:acct:burst${i}@x.com`)));
    expect(burst.map((r) => r?.failures)).toEqual([34, 33, 33]);
  });

  it("a parallel burst of exactly the limit locks the account", async () => {
    const { limiter: l } = limiter();
    await Promise.all(Array.from({ length: 5 }, (_, i) => l.recordFailure(`5.5.5.${i}`, "burst@x.com", T0)));
    expect((await l.check("9.9.9.9", "burst@x.com", T0)).allowed).toBe(false);
  });

  // A1 (L25): with a capped in-memory map, ~2000 locks for other keys evicted a target's lock.
  it("keeps a lock no matter how many other keys are locked", async () => {
    const { namespace, limiter: l } = limiter();
    for (let i = 0; i < 5; i++) await l.recordFailure("1.1.1.1", "target@x.com", T0);
    await db.$executeRaw`
      INSERT INTO "AuthThrottle" ("key", "failures", "windowStart", "lockedUntil", "updatedAt")
      SELECT ${namespace} || ':acct:flood' || g || '@x.com', 5, ${new Date(T0 + 1)}, ${new Date(T0 + 1 + WINDOW)}, ${new Date(T0 + 1)}
      FROM generate_series(1, 12000) AS g`;
    // And the regular path keeps writing locks for other keys after the flood.
    for (let i = 0; i < 5; i++) await l.recordFailure(`10.1.0.${i}`, "late@x.com", T0 + 2);

    expect(await db.authThrottle.count({ where: { key: { startsWith: `${namespace}:acct:` } } })).toBe(12_002);
    expect(await l.check("9.9.9.9", "target@x.com", T0 + 3)).toEqual({ allowed: false, retryAfterSeconds: 15 * 60 });
  });

  it("clears the account after a successful login and keeps the IP counter", async () => {
    const { namespace, limiter: l } = limiter();
    for (let i = 0; i < 4; i++) await l.recordFailure("1.1.1.1", "a@x.com", T0);
    await l.clear("1.1.1.1", "A@x.com");
    expect(await row(`${namespace}:acct:a@x.com`)).toBeNull();
    expect((await row(`${namespace}:ip:1.1.1.1`))?.failures).toBe(4);
    for (let i = 0; i < 4; i++) await l.recordFailure("1.1.1.1", "a@x.com", T0);
    expect((await l.check("1.1.1.1", "a@x.com", T0)).allowed).toBe(true);
  });

  it("keeps the login and reset namespaces apart", async () => {
    const login = limiter();
    const reset = limiter({ maxPerAccount: 3, maxPerIp: 10 });
    for (let i = 0; i < 3; i++) await reset.limiter.recordFailure("6.6.6.6", "both@x.com", T0);
    expect((await reset.limiter.check("6.6.6.6", "both@x.com", T0)).allowed).toBe(false);
    expect((await login.limiter.check("6.6.6.6", "both@x.com", T0)).allowed).toBe(true);
  });

  it("cleanup deletes only rows whose window and lock have both expired, in its own namespace", async () => {
    const { namespace, limiter: l } = limiter();
    const other = limiter();
    await l.recordFailure("7.7.7.1", "old@x.com", T0);
    for (let i = 0; i < 5; i++) await l.recordFailure("7.7.7.2", "locked@x.com", T0 + 10 * MINUTE);
    await l.recordFailure("7.7.7.3", "counting@x.com", T0 + 10 * MINUTE);
    await other.limiter.recordFailure("7.7.7.4", "foreign@x.com", T0);
    // Not produced by the upsert, but a live lock must survive even with an expired window.
    await db.authThrottle.create({
      data: { key: `${namespace}:acct:odd@x.com`, failures: 5, windowStart: new Date(T0), lockedUntil: new Date(T0 + 60 * MINUTE) },
    });

    const deleted = await l.cleanup(T0 + 16 * MINUTE);

    const keys = (await db.authThrottle.findMany({ where: { key: { startsWith: RUN } }, select: { key: true } })).map((r) => r.key);
    expect(deleted).toBe(2);
    expect(keys).not.toContain(`${namespace}:acct:old@x.com`);
    expect(keys).not.toContain(`${namespace}:ip:7.7.7.1`);
    for (const kept of ["acct:locked@x.com", "ip:7.7.7.2", "acct:counting@x.com", "ip:7.7.7.3", "acct:odd@x.com"]) {
      expect(keys).toContain(`${namespace}:${kept}`);
    }
    expect(keys).toContain(`${other.namespace}:acct:foreign@x.com`);
    expect((await l.check("9.9.9.9", "locked@x.com", T0 + 16 * MINUTE)).allowed).toBe(false);
  });

  it("runs the cleanup from recordFailure at most once per interval", async () => {
    const { namespace, limiter: l } = limiter({ cleanupEveryMs: 5 * MINUTE });
    const expired = { failures: 1, windowStart: new Date(T0 - 60 * MINUTE) };
    await db.authThrottle.create({ data: { key: `${namespace}:acct:expired1@x.com`, ...expired } });
    await l.recordFailure("8.8.8.8", "a@x.com", T0);
    expect(await row(`${namespace}:acct:expired1@x.com`)).toBeNull();

    await db.authThrottle.create({ data: { key: `${namespace}:acct:expired2@x.com`, ...expired } });
    await l.recordFailure("8.8.8.8", "a@x.com", T0 + 4 * MINUTE);
    expect(await row(`${namespace}:acct:expired2@x.com`)).not.toBeNull();
    await l.recordFailure("8.8.8.8", "a@x.com", T0 + 5 * MINUTE);
    expect(await row(`${namespace}:acct:expired2@x.com`)).toBeNull();
  });
});
