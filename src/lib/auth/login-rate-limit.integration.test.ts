// @vitest-environment node
// The throttle tables live in the local Docker database (rule 2). Every limiter here uses its own
// namespace under RUN, so runs never collide with each other or with the app's "login"/"reset" rows.
import { createHash } from "node:crypto";
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

// Keys keep the namespace and kind in clear text and hash the value, so their length is fixed.
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const acct = (namespace: string, email: string) => `${namespace}:acct:${sha256(email.toLowerCase())}`;
const ipKey = (namespace: string, ip: string) => `${namespace}:ip:${sha256(ip)}`;
const row = (key: string) => db.authThrottle.findUnique({ where: { key } });
const allowedCount = (answers: Array<{ allowed: boolean }>) => answers.filter((a) => a.allowed).length;

describe.skipIf(!local)("login rate limiter (Postgres)", () => {
  afterAll(async () => {
    await db.authThrottle.deleteMany({ where: { key: { startsWith: RUN } } });
  });

  it("allows attempts up to the per-account limit, then refuses for the whole window", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 5; i++) expect(await l.consume("1.1.1.1", "a@x.com", T0)).toEqual({ allowed: true });
    expect(await l.consume("1.1.1.1", "a@x.com", T0)).toEqual({ allowed: false, retryAfterSeconds: 15 * 60 });
  });

  it("keeps the account locked when the attacker changes IP, and treats the email case-insensitively", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 5; i++) await l.consume(`10.0.0.${i}`, "A@X.com", T0);
    expect((await l.consume("10.9.9.9", "a@x.com", T0)).allowed).toBe(false);
  });

  it("locks one IP across many accounts, and only that IP", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 20; i++) await l.consume("2.2.2.2", `user${i}@x.com`, T0);
    expect((await l.consume("2.2.2.2", "fresh@x.com", T0)).allowed).toBe(false);
    expect((await l.consume("3.3.3.3", "fresh@x.com", T0)).allowed).toBe(true);
  });

  it("stores fixed-length keys: namespace and kind in clear text, the value hashed", async () => {
    const { namespace, limiter: l } = limiter();
    await l.consume("203.0.113.9", "Someone@X.com", T0);
    const keys = (await db.authThrottle.findMany({ where: { key: { startsWith: `${namespace}:` } }, select: { key: true } })).map((r) => r.key);
    expect(keys.sort()).toEqual([acct(namespace, "someone@x.com"), ipKey(namespace, "203.0.113.9")].sort());
    expect(keys.join()).not.toContain("someone");
    expect(keys.join()).not.toContain("203.0.113.9");
  });

  // An unhashed key over ~2704 bytes does not fit the primary-key btree, so the write failed and the
  // attempt was never counted.
  it("counts and locks a 3000-character email and a 3000-character forged address", async () => {
    const { limiter: l } = limiter();
    const email = `${"a".repeat(2990)}@x.com`;
    for (let i = 0; i < 5; i++) expect((await l.consume(`10.2.0.${i}`, email, T0)).allowed).toBe(true);
    expect((await l.consume("10.2.1.1", email, T0)).allowed).toBe(false);

    const ip = "9".repeat(3000);
    for (let i = 0; i < 20; i++) expect((await l.consume(ip, `long${i}@x.com`, T0)).allowed).toBe(true);
    expect((await l.consume(ip, "long-fresh@x.com", T0)).allowed).toBe(false);
  });

  it("starts a new window once the previous one has passed", async () => {
    const { namespace, limiter: l } = limiter();
    for (let i = 0; i < 5; i++) await l.consume("1.1.1.1", "a@x.com", T0);
    const next = T0 + WINDOW;
    expect(await l.consume("1.1.1.1", "a@x.com", next)).toEqual({ allowed: true });

    // The old attempts are gone: the window restarts at the new attempt with a count of one.
    expect(await row(acct(namespace, "a@x.com"))).toMatchObject({ failures: 1, windowStart: new Date(next), lockedUntil: null });
    for (let i = 0; i < 4; i++) expect((await l.consume("1.1.1.1", "a@x.com", next + 1)).allowed).toBe(true);
    expect(await l.consume("1.1.1.1", "a@x.com", next + 2)).toEqual({ allowed: false, retryAfterSeconds: 15 * 60 });
  });

  it("lifts the lock exactly when the window ends", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 5; i++) await l.consume("1.1.1.1", "a@x.com", T0);
    expect(await l.consume("1.1.1.1", "a@x.com", T0 + WINDOW - 1)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(await l.consume("1.1.1.1", "a@x.com", T0 + WINDOW)).toEqual({ allowed: true });
  });

  it("reports the later unlock when both the account and the address are locked, and that wait is the real one", async () => {
    const { limiter: l } = limiter();
    for (let i = 0; i < 20; i++) await l.consume("2.2.2.2", `user${i}@x.com`, T0);
    for (let i = 0; i < 5; i++) await l.consume(`10.0.0.${i}`, "target@x.com", T0 + 5 * MINUTE);

    // The address unlocks at minute 15, the account at minute 20.
    const asked = T0 + 5 * MINUTE + 12_300;
    const answer = await l.consume("2.2.2.2", "target@x.com", asked);
    expect(answer).toEqual({ allowed: false, retryAfterSeconds: 888 });
    if (answer.allowed) throw new Error("unreachable");
    expect((await l.consume("2.2.2.2", "target@x.com", asked + answer.retryAfterSeconds * 1000 - 1000)).allowed).toBe(false);
    expect((await l.consume("2.2.2.2", "target@x.com", asked + answer.retryAfterSeconds * 1000)).allowed).toBe(true);
  });

  // B1: counting before deciding, in one statement per key, so parallel requests cannot all pass.
  it("lets exactly the limit through when many attempts arrive in parallel", async () => {
    const { namespace, limiter: l } = limiter();
    const answers = await Promise.all(Array.from({ length: 30 }, (_, i) => l.consume(`5.5.${i}.1`, "race@x.com", T0)));
    expect(allowedCount(answers)).toBe(5);
    expect(await row(acct(namespace, "race@x.com"))).toMatchObject({ failures: 30, lockedUntil: new Date(T0 + WINDOW) });

    const fromOneIp = await Promise.all(Array.from({ length: 50 }, (_, i) => l.consume("5.6.0.1", `ip-race${i}@x.com`, T0)));
    expect(allowedCount(fromOneIp)).toBe(20);
  });

  it("counts concurrent attempts exactly and locks exactly at the limit", async () => {
    const { namespace, limiter: l } = limiter({ maxPerAccount: 40, maxPerIp: 10_000 });
    const first = await Promise.all(Array.from({ length: 39 }, () => l.consume("4.4.4.4", "race@x.com", T0)));
    expect(allowedCount(first)).toBe(39);
    expect(await row(acct(namespace, "race@x.com"))).toMatchObject({ failures: 39, lockedUntil: null });

    expect(await l.consume("4.4.4.4", "race@x.com", T0)).toEqual({ allowed: true });
    expect(await row(acct(namespace, "race@x.com"))).toMatchObject({ failures: 40, lockedUntil: new Date(T0 + WINDOW) });
    expect((await l.consume("4.4.4.4", "race@x.com", T0)).allowed).toBe(false);

    await Promise.all(Array.from({ length: 100 }, (_, i) => l.consume("4.4.4.4", `burst${i % 3}@x.com`, T0)));
    expect((await row(ipKey(namespace, "4.4.4.4")))?.failures).toBe(141);
    const burst = await Promise.all([0, 1, 2].map((i) => row(acct(namespace, `burst${i}@x.com`))));
    expect(burst.map((r) => r?.failures)).toEqual([34, 33, 33]);
  });

  // A1 (L25): with a capped in-memory map, ~2000 locks for other keys evicted a target's lock.
  it("keeps a lock no matter how many other keys are locked", async () => {
    const { namespace, limiter: l } = limiter();
    for (let i = 0; i < 5; i++) await l.consume("1.1.1.1", "target@x.com", T0);
    await db.$executeRaw`
      INSERT INTO "AuthThrottle" ("key", "failures", "windowStart", "lockedUntil", "updatedAt")
      SELECT ${namespace} || ':acct:flood' || g, 5, ${new Date(T0 + 1)}, ${new Date(T0 + 1 + WINDOW)}, ${new Date(T0 + 1)}
      FROM generate_series(1, 12000) AS g`;
    // And the regular path keeps writing locks for other keys after the flood.
    for (let i = 0; i < 5; i++) await l.consume(`10.1.0.${i}`, "late@x.com", T0 + 2);

    expect(await db.authThrottle.count({ where: { key: { startsWith: `${namespace}:acct:` } } })).toBe(12_002);
    expect(await l.consume("9.9.9.9", "target@x.com", T0 + 3)).toEqual({ allowed: false, retryAfterSeconds: 15 * 60 });
  });

  it("a success clears the account and gives the address its attempt back", async () => {
    const { namespace, limiter: l } = limiter();
    for (let i = 0; i < 4; i++) await l.consume("1.1.1.1", "a@x.com", T0);
    await l.consume("1.1.1.1", "a@x.com", T0);
    await l.recordSuccess("1.1.1.1", "A@x.com", T0);
    expect(await row(acct(namespace, "a@x.com"))).toBeNull();
    // As before T14's B1 fix: a success neither counts against the address nor resets it.
    expect((await row(ipKey(namespace, "1.1.1.1")))?.failures).toBe(4);
    for (let i = 0; i < 5; i++) expect((await l.consume("1.1.1.1", "a@x.com", T0)).allowed).toBe(true);
  });

  it("never locks an address that only logs in successfully", async () => {
    const { namespace, limiter: l } = limiter();
    for (let i = 0; i < 25; i++) {
      expect((await l.consume("1.2.3.4", `ok${i % 2}@x.com`, T0)).allowed).toBe(true);
      await l.recordSuccess("1.2.3.4", `ok${i % 2}@x.com`, T0);
    }
    expect(await row(ipKey(namespace, "1.2.3.4"))).toMatchObject({ failures: 0, lockedUntil: null });
  });

  it("a success refunds only the window that counted it", async () => {
    const { namespace, limiter: l } = limiter();
    await l.consume("1.2.3.5", "a@x.com", T0);
    await l.consume("1.2.3.5", "b@x.com", T0 + WINDOW);
    // The attempt at T0 belonged to a window that has since restarted: nothing to give back.
    await l.recordSuccess("1.2.3.5", "a@x.com", T0);
    expect((await row(ipKey(namespace, "1.2.3.5")))?.failures).toBe(1);
  });

  it("keeps the login and reset namespaces apart", async () => {
    const login = limiter();
    const reset = limiter({ maxPerAccount: 3, maxPerIp: 10 });
    for (let i = 0; i < 3; i++) await reset.limiter.consume("6.6.6.6", "both@x.com", T0);
    expect((await reset.limiter.consume("6.6.6.6", "both@x.com", T0)).allowed).toBe(false);
    expect((await login.limiter.consume("6.6.6.6", "both@x.com", T0)).allowed).toBe(true);
  });

  it("cleanup deletes only rows whose window and lock have both expired, in its own namespace", async () => {
    const { namespace, limiter: l } = limiter();
    const other = limiter();
    await l.consume("7.7.7.1", "old@x.com", T0);
    for (let i = 0; i < 5; i++) await l.consume("7.7.7.2", "locked@x.com", T0 + 10 * MINUTE);
    await l.consume("7.7.7.3", "counting@x.com", T0 + 10 * MINUTE);
    await other.limiter.consume("7.7.7.4", "foreign@x.com", T0);
    // Not produced by the upsert, but a live lock must survive even with an expired window.
    await db.authThrottle.create({
      data: { key: `${namespace}:acct:odd`, failures: 5, windowStart: new Date(T0), lockedUntil: new Date(T0 + 60 * MINUTE) },
    });

    const deleted = await l.cleanup(T0 + 16 * MINUTE);

    const keys = (await db.authThrottle.findMany({ where: { key: { startsWith: RUN } }, select: { key: true } })).map((r) => r.key);
    expect(deleted).toBe(2);
    expect(keys).not.toContain(acct(namespace, "old@x.com"));
    expect(keys).not.toContain(ipKey(namespace, "7.7.7.1"));
    for (const kept of [acct(namespace, "locked@x.com"), ipKey(namespace, "7.7.7.2"), acct(namespace, "counting@x.com"), ipKey(namespace, "7.7.7.3"), `${namespace}:acct:odd`]) {
      expect(keys).toContain(kept);
    }
    expect(keys).toContain(acct(other.namespace, "foreign@x.com"));
    expect((await l.consume("9.9.9.9", "locked@x.com", T0 + 16 * MINUTE)).allowed).toBe(false);
  });

  it("runs the cleanup from consume at most once per interval", async () => {
    const { namespace, limiter: l } = limiter({ cleanupEveryMs: 5 * MINUTE });
    const expired = { failures: 1, windowStart: new Date(T0 - 60 * MINUTE) };
    await db.authThrottle.create({ data: { key: `${namespace}:acct:expired1`, ...expired } });
    await l.consume("8.8.8.8", "a@x.com", T0);
    expect(await row(`${namespace}:acct:expired1`)).toBeNull();

    await db.authThrottle.create({ data: { key: `${namespace}:acct:expired2`, ...expired } });
    await l.consume("8.8.8.8", "a@x.com", T0 + 4 * MINUTE);
    expect(await row(`${namespace}:acct:expired2`)).not.toBeNull();
    await l.consume("8.8.8.8", "a@x.com", T0 + 5 * MINUTE);
    expect(await row(`${namespace}:acct:expired2`)).toBeNull();
  });
});
