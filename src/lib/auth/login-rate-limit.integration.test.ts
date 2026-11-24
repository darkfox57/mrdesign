// @vitest-environment node
// The throttle tables live in the local Docker database (rule 2). Every limiter here uses its own
// namespace under RUN, so runs never collide with each other or with the app's "login"/"reset" rows.
import { afterAll, describe, expect, it, vi } from "vitest";
import { db } from "../db";
import { isLocalDatabase } from "../is-local-database";
import { createLoginRateLimiter, throttleKey, type ThrottleDb } from "./login-rate-limit";

const local = isLocalDatabase(process.env.DATABASE_URL);
const RUN = `t14-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const MINUTE = 60_000;
const WINDOW = 15 * MINUTE;
const T0 = Date.UTC(2026, 10, 24, 12, 0, 0);

let seq = 0;
function limiter(options: { maxPerAccount?: number; maxPerIp?: number; cleanupEveryMs?: number; db?: ThrottleDb } = {}) {
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
      db: options.db,
    }),
  };
}

const acct = (namespace: string, email: string) => throttleKey(namespace, "acct", email);
const ipKey = (namespace: string, ip: string) => throttleKey(namespace, "ip", ip);
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

  // R1/R3 (T16): the two keys were two statements, so one could keep its increment while the
  // attempt was refused as unavailable. Five such half-counts locked an account without a guess.
  it("counts both keys or neither: a failed address count leaves no account increment", async () => {
    const { namespace, limiter: l } = limiter();
    // A counter at the integer maximum makes the address increment fail ("integer out of range").
    await db.authThrottle.create({ data: { key: ipKey(namespace, "198.18.4.1"), failures: 2_147_483_647, windowStart: new Date(T0) } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    for (let i = 0; i < 6; i++) expect(await l.consume("198.18.4.1", "half@x.com", T0)).toMatchObject({ allowed: false, unavailable: true });
    expect(log).toHaveBeenCalledWith("auth throttle write failed", expect.anything());
    log.mockRestore();

    expect(await row(acct(namespace, "half@x.com"))).toBeNull();
    expect(await l.consume("198.18.4.2", "half@x.com", T0)).toEqual({ allowed: true });
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

  // R2 (T16): the lock is stored by the first refused attempt, so a stored lock and a refusal are the
  // same thing. The attempt that uses the last slot is allowed and stores no lock.
  it("counts concurrent attempts exactly and stores the lock with the first refusal", async () => {
    const { namespace, limiter: l } = limiter({ maxPerAccount: 40, maxPerIp: 10_000 });
    const first = await Promise.all(Array.from({ length: 39 }, () => l.consume("4.4.4.4", "race@x.com", T0)));
    expect(allowedCount(first)).toBe(39);
    expect(await row(acct(namespace, "race@x.com"))).toMatchObject({ failures: 39, lockedUntil: null });

    expect(await l.consume("4.4.4.4", "race@x.com", T0)).toEqual({ allowed: true });
    expect(await row(acct(namespace, "race@x.com"))).toMatchObject({ failures: 40, lockedUntil: null });
    expect((await l.consume("4.4.4.4", "race@x.com", T0)).allowed).toBe(false);
    expect(await row(acct(namespace, "race@x.com"))).toMatchObject({ failures: 41, lockedUntil: new Date(T0 + WINDOW) });

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

  // R4 (T16) repro: maxPerIp-1 failures, then a success, then again. Successes must not buy an
  // address more failed guesses than maxPerIp per window.
  it("caps the failed guesses of one address even when its users keep logging in", async () => {
    const { limiter: l } = limiter({ maxPerIp: 3 });
    let failedGuesses = 0;
    for (let round = 0; round < 5; round++) {
      for (let i = 0; i < 2; i++) if ((await l.consume("198.18.18.1", `guess-${round}-${i}@x.com`, T0)).allowed) failedGuesses++;
      if ((await l.consume("198.18.18.1", "owner@x.com", T0)).allowed) await l.recordSuccess("198.18.18.1", "owner@x.com", T0);
    }
    expect(failedGuesses).toBeLessThanOrEqual(3);
    expect((await l.consume("198.18.18.1", "fresh@x.com", T0)).allowed).toBe(false);
  });

  // R4 (T16): a refund gives back a slot, never a lock. Once an address has been refused in a window,
  // successes counted earlier in that window do not lift the refusal.
  it("keeps an address refused after the success refunds of attempts counted before the lock", async () => {
    const { namespace, limiter: l } = limiter({ maxPerIp: 3 });
    for (const email of ["s1@x.com", "s2@x.com", "f1@x.com"]) expect((await l.consume("198.18.19.1", email, T0)).allowed).toBe(true);
    expect((await l.consume("198.18.19.1", "f2@x.com", T0)).allowed).toBe(false);
    const locked = (await row(ipKey(namespace, "198.18.19.1")))?.lockedUntil;
    expect(locked).toEqual(new Date(T0 + WINDOW));

    await l.recordSuccess("198.18.19.1", "s1@x.com", T0);
    await l.recordSuccess("198.18.19.1", "s2@x.com", T0);

    expect(await row(ipKey(namespace, "198.18.19.1"))).toMatchObject({ failures: 2, lockedUntil: locked });
    expect((await l.consume("198.18.19.1", "f3@x.com", T0)).allowed).toBe(false);
  });

  // R4 (T16, critical): an attempt whose password check failed for infrastructure reasons is given
  // back on both keys, so outages cannot lock a valid account.
  it("refund gives the attempt back on both keys: ten refunded attempts lock nothing", async () => {
    const { namespace, limiter: l } = limiter();
    for (let i = 0; i < 10; i++) {
      expect(await l.consume("198.18.20.1", "outage@x.com", T0)).toEqual({ allowed: true });
      await l.refund("198.18.20.1", "outage@x.com", T0);
    }
    expect(await row(acct(namespace, "outage@x.com"))).toMatchObject({ failures: 0, lockedUntil: null });
    expect(await row(ipKey(namespace, "198.18.20.1"))).toMatchObject({ failures: 0, lockedUntil: null });
    expect(await l.consume("198.18.20.1", "outage@x.com", T0)).toEqual({ allowed: true });
  });

  it("refund never takes a counter below zero, nor outside the window that counted it", async () => {
    const { namespace, limiter: l } = limiter();
    await l.consume("198.18.21.1", "zero@x.com", T0);
    for (let i = 0; i < 3; i++) await l.refund("198.18.21.1", "zero@x.com", T0);
    expect(await row(acct(namespace, "zero@x.com"))).toMatchObject({ failures: 0 });
    expect(await row(ipKey(namespace, "198.18.21.1"))).toMatchObject({ failures: 0 });

    await l.consume("198.18.21.1", "zero@x.com", T0 + WINDOW);
    await l.refund("198.18.21.1", "zero@x.com", T0);
    expect(await row(acct(namespace, "zero@x.com"))).toMatchObject({ failures: 1 });
  });

  it("refund never lifts a lock that real attempts reached", async () => {
    const { namespace, limiter: l } = limiter();
    for (let i = 0; i < 6; i++) await l.consume("198.18.22.1", "locked@x.com", T0);
    for (let i = 0; i < 3; i++) await l.refund("198.18.22.1", "locked@x.com", T0);

    expect(await row(acct(namespace, "locked@x.com"))).toMatchObject({ failures: 3, lockedUntil: new Date(T0 + WINDOW) });
    expect((await l.consume("198.18.22.2", "locked@x.com", T0 + 1)).allowed).toBe(false);
  });

  // R3 (T16): a correct password as the 5th attempt, then the success write fails once.
  it("leaves the account usable when the success write fails once after a correct last attempt", async () => {
    let failing = 1;
    const flaky = {
      $queryRaw: db.$queryRaw.bind(db),
      $executeRaw: db.$executeRaw.bind(db),
      authThrottle: {
        deleteMany: (args: Parameters<typeof db.authThrottle.deleteMany>[0]) =>
          failing-- > 0 ? Promise.reject(new Error("Connection terminated unexpectedly")) : db.authThrottle.deleteMany(args),
      },
    } as unknown as ThrottleDb;
    const { namespace, limiter: l } = limiter({ db: flaky });
    for (let i = 0; i < 5; i++) expect((await l.consume("198.18.23.1", "owner@x.com", T0)).allowed).toBe(true);

    await l.recordSuccess("198.18.23.1", "owner@x.com", T0);

    expect(await row(acct(namespace, "owner@x.com"))).toBeNull();
    expect(await l.consume("198.18.23.1", "owner@x.com", T0 + 1)).toEqual({ allowed: true });
  });

  // Regression tests from the T16 verification: counts, refunds and cleanup running together.
  it("never deadlocks or fails closed when crossing keys, refunds and cleanup run in parallel", async () => {
    const { namespace, limiter: l } = limiter({ maxPerAccount: 1000, maxPerIp: 1000 });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    await db.authThrottle.createMany({
      data: Array.from({ length: 200 }, (_, i) => ({ key: `${namespace}:old:${i}`, failures: 3, windowStart: new Date(T0 - 2 * WINDOW), updatedAt: new Date(T0) })),
    });
    const emails = ["a@x.test", "b@x.test"];
    const ips = ["2001:db8::1", "2001:db8::2"];
    const ops: Array<Promise<unknown>> = [];
    for (let i = 0; i < 400; i++) {
      const email = emails[i % 2];
      const ip = ips[Math.floor(i / 2) % 2];
      if (i % 7 === 0) ops.push(l.cleanup(T0));
      else if (i % 7 === 1) ops.push(l.refund(ip, email, T0, T0));
      else ops.push(l.consume(ip, email, T0));
    }

    const results = await Promise.allSettled(ops);
    errors.mockRestore();

    expect(results.filter((r) => r.status === "rejected")).toEqual([]);
    expect(results.filter((r) => r.status === "fulfilled" && (r.value as { unavailable?: true } | undefined)?.unavailable)).toHaveLength(0);
    const rows = await db.authThrottle.findMany({ where: { key: { startsWith: `${namespace}:` } } });
    for (const r of rows) expect(r.failures).toBeGreaterThanOrEqual(0);
    expect(rows.filter((r) => r.key.startsWith(`${namespace}:old:`))).toHaveLength(0);
  });

  it("never loses a count when cleanup races with counts on an expired row", async () => {
    const { namespace, limiter: l } = limiter({ maxPerAccount: 1000, maxPerIp: 1000 });
    const email = "race@x.test";
    const ip = "2001:db8::9";
    for (let round = 0; round < 10; round++) {
      const now = T0 + round * 3 * WINDOW;
      await db.authThrottle.deleteMany({ where: { key: { startsWith: `${namespace}:` } } });
      await db.authThrottle.createMany({
        data: [acct(namespace, email), ipKey(namespace, ip)].map((key) => ({
          key,
          failures: 9,
          windowStart: new Date(now - 2 * WINDOW),
          lockedUntil: new Date(now - WINDOW),
          updatedAt: new Date(now - WINDOW),
        })),
      });
      const ops: Array<Promise<unknown>> = [];
      for (let i = 0; i < 40; i++) {
        ops.push(l.consume(ip, email, now));
        if (i % 4 === 0) ops.push(l.cleanup(now));
      }
      await Promise.all(ops);

      expect((await row(acct(namespace, email)))?.failures).toBe(40);
      expect((await row(ipKey(namespace, ip)))?.failures).toBe(40);
    }
  });

  it("keeps counts exact when refunds race with counts", async () => {
    const { namespace, limiter: l } = limiter({ maxPerAccount: 1000, maxPerIp: 1000 });
    const email = "refund@x.test";
    const ip = "2001:db8::a";
    await l.consume(ip, email, T0);
    const ops: Array<Promise<unknown>> = [];
    for (let i = 0; i < 60; i++) {
      ops.push(i < 30 ? l.consume(ip, email, T0).then(() => l.refund(ip, email, T0, T0)) : l.consume(ip, email, T0));
    }
    await Promise.all(ops);

    expect((await row(acct(namespace, email)))?.failures).toBe(31);
    expect((await row(ipKey(namespace, ip)))?.failures).toBe(31);
  });

  it("keeps an address lock after every success refund", async () => {
    const { namespace, limiter: l } = limiter({ maxPerAccount: 5, maxPerIp: 3 });
    const ip = "2001:db8::d";
    for (let i = 0; i < 3; i++) await l.consume(ip, `ok${i}@x.test`, T0);
    expect((await l.consume(ip, "victim@x.test", T0 + 10)).allowed).toBe(false);

    for (let i = 0; i < 3; i++) await l.recordSuccess(ip, `ok${i}@x.test`, T0, T0 + 20);

    expect((await row(ipKey(namespace, ip)))?.lockedUntil?.getTime()).toBe(T0 + WINDOW);
    expect((await l.consume(ip, "victim@x.test", T0 + 30)).allowed).toBe(false);
  });
});
