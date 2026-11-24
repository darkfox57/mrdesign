// Brute-force guard for the admin login and password-reset server actions. better-auth's own rate
// limit only covers HTTP calls to /api/auth/*, not `auth.api.*` calls made from server actions.
//
// Counters live in Postgres (AuthThrottle): locks survive restarts, hold across instances, and are
// never evicted by other keys, so flooding the table with locks for other accounts or addresses
// cannot release a target's lock (A1). Each key counts attempts in a fixed window that starts at its
// first attempt; past the limit the key is refused until that window ends.
//
// Attempts are counted before they are verified (B1): `consume` increments both keys and decides in
// one statement, so parallel requests cannot all pass a check made before any of them counted.
//
// The column is still called `failures` (renaming it needs a migration), but it counts attempts:
// every counted attempt until a refund gives one back.
import { createHash } from "node:crypto";
// Type only: the Prisma client is loaded on first use, so code that only needs `throttleKey` (the
// e2e specs, whose loader cannot import the generated client) can import this module.
import type { db as AppDb } from "@/lib/db";

export type ThrottleDb = Pick<typeof AppDb, "authThrottle" | "$executeRaw" | "$queryRaw">;
const appDb = async (): Promise<ThrottleDb> => (await import("@/lib/db")).db;

type Options = {
  // Prefix of every key, so the login and reset limiters (and tests) never share rows.
  namespace: string;
  windowMs: number;
  maxPerAccount: number;
  maxPerIp: number;
  // Expired rows are deleted from consume at most this often per process.
  cleanupEveryMs?: number;
  db?: ThrottleDb;
};

type Decision = { allowed: true } | { allowed: false; retryAfterSeconds: number; unavailable?: true };
type Counted = { key: string; lockedUntil: Date | null };

// Shown as "try again in a minute" when the database cannot answer.
const UNAVAILABLE_RETRY_SECONDS = 60;

// Emails and forwarded addresses are attacker-controlled and unbounded: an unhashed key over ~2704
// bytes does not fit the primary-key index, so its attempts were never counted. The hash keeps every
// key short; the namespace and kind stay readable so rows can be found and purged by prefix.
// The one place keys are derived: tests, e2e cleanups and the unlock recipe in docs/admin.md use it.
const hashed = (value: string) => createHash("sha256").update(value).digest("hex");
export const throttleKey = (namespace: string, kind: "acct" | "ip", value: string) =>
  `${namespace}:${kind}:${hashed(kind === "acct" ? value.toLowerCase() : value)}`;

export function createLoginRateLimiter({
  namespace,
  windowMs,
  maxPerAccount,
  maxPerIp,
  cleanupEveryMs = 5 * 60_000,
  db,
}: Options) {
  const database = () => (db ? Promise.resolve(db) : appDb());
  // The account key ignores the IP on purpose: rotating (or forging) the client address must not
  // reset an account lock. Trade-off: anyone can lock an account for one window with bad guesses.
  const accountKey = (email: string) => throttleKey(namespace, "acct", email);
  const ipKey = (ip: string) => throttleKey(namespace, "ip", ip);
  let lastCleanup = Number.NEGATIVE_INFINITY;

  // Gives one attempt back to `key`, only in the window that counted it (at `countedAt`), never
  // below zero. It never touches `lockedUntil`: a refund returns a slot, never a lock. A lock is only
  // stored by an attempt that was refused, so it stands for the rest of its window.
  const refundKey = (client: ThrottleDb, key: string, countedAt: number, now: number) =>
    client.$executeRaw`
      UPDATE "AuthThrottle" SET "failures" = GREATEST("failures" - 1, 0), "updatedAt" = ${new Date(now)}::timestamptz
      WHERE "key" = ${key}
        AND "windowStart" <= ${new Date(countedAt)}::timestamptz
        AND "windowStart" > ${new Date(countedAt - windowMs)}::timestamptz`;

  // Deletes this namespace's rows whose window and lock have both ended. Returns how many went.
  // SKIP LOCKED: cleanup never waits for a row a count is writing, so it cannot deadlock with one.
  const cleanup = async (now = Date.now()) =>
    (await database()).$executeRaw`
      DELETE FROM "AuthThrottle" WHERE "key" IN (
        SELECT "key" FROM "AuthThrottle"
        WHERE starts_with("key", ${`${namespace}:`})
          AND "windowStart" <= ${new Date(now - windowMs)}::timestamptz
          AND ("lockedUntil" IS NULL OR "lockedUntil" <= ${new Date(now)}::timestamptz)
        FOR UPDATE SKIP LOCKED)`;

  return {
    // Counts the attempt on the account and the address in one statement, so both increments commit
    // or neither does, then decides: a key refuses while its lock is in the future. Fails closed: an
    // attempt that cannot be counted is refused (and logged). Login needs the database anyway, and an
    // unthrottled path is what an attacker would aim for.
    async consume(ip: string, email: string, now = Date.now()): Promise<Decision> {
      const keys = [accountKey(email), ipKey(ip)];
      let counted: Counted[];
      try {
        const at = new Date(now);
        const windowEnd = new Date(now + windowMs);
        const expiredBefore = new Date(now - windowMs);
        // Postgres serializes the upserts on the primary key, and each row returns its state after
        // its own increment, so concurrent attempts count exactly. Rows are locked in VALUES order
        // (account, then address) by every count, so two counts cannot deadlock. An expired window
        // restarts at this attempt with a count of one. The first attempt past the key's limit stores
        // the lock until the end of the window; the attempt that uses the last slot is allowed and
        // stores none, so a stored lock and a refusal are the same thing. Every SET expression reads
        // the old row; EXCLUDED is the row this attempt would have inserted.
        const rows = await (await database()).$queryRaw<Counted[]>`
          INSERT INTO "AuthThrottle" ("key", "failures", "windowStart", "lockedUntil", "updatedAt")
          VALUES
            (${keys[0]}, 1, ${at}, CASE WHEN 1 > ${maxPerAccount}::integer THEN ${windowEnd}::timestamptz END, ${at}),
            (${keys[1]}, 1, ${at}, CASE WHEN 1 > ${maxPerIp}::integer THEN ${windowEnd}::timestamptz END, ${at})
          ON CONFLICT ("key") DO UPDATE SET
            "failures" = CASE WHEN "AuthThrottle"."windowStart" <= ${expiredBefore}::timestamptz THEN 1
                              ELSE "AuthThrottle"."failures" + 1 END,
            "windowStart" = CASE WHEN "AuthThrottle"."windowStart" <= ${expiredBefore}::timestamptz THEN ${at}::timestamptz
                                 ELSE "AuthThrottle"."windowStart" END,
            "lockedUntil" = CASE
              WHEN "AuthThrottle"."windowStart" <= ${expiredBefore}::timestamptz THEN EXCLUDED."lockedUntil"
              WHEN "AuthThrottle"."failures" + 1 >
                   CASE WHEN "AuthThrottle"."key" = ${keys[0]} THEN ${maxPerAccount}::integer ELSE ${maxPerIp}::integer END
                THEN GREATEST("AuthThrottle"."lockedUntil", "AuthThrottle"."windowStart" + ${windowMs}::integer * interval '1 millisecond')
              ELSE "AuthThrottle"."lockedUntil"
            END,
            "updatedAt" = ${at}::timestamptz
          RETURNING "key", "lockedUntil"`;
        counted = keys.map((key) => {
          const row = rows.find((candidate) => candidate.key === key);
          if (!row) throw new Error(`auth throttle count returned no row for ${key}`);
          return row;
        });
      } catch (error) {
        console.error("auth throttle write failed", error);
        return { allowed: false, unavailable: true, retryAfterSeconds: UNAVAILABLE_RETRY_SECONDS };
      }
      if (now - lastCleanup >= cleanupEveryMs) {
        lastCleanup = now;
        // Housekeeping only: a failed cleanup must not change the decision.
        await cleanup(now).catch((error: unknown) => console.error("auth throttle cleanup failed", error));
      }

      const locks = counted.map((row) => row.lockedUntil?.getTime() ?? 0).filter((until) => until > now);
      if (!locks.length) return { allowed: true };
      // Every locked key blocks the attempt, so the wait lasts until the last one unlocks.
      return { allowed: false, retryAfterSeconds: Math.ceil((Math.max(...locks) - now) / 1000) };
    },
    // A successful login clears the account and gives the address back the attempt `consume` counted
    // at `countedAt`, so successes never count against an address under normal use. The address is
    // not reset (other accounts may be under attack from it), and its lock, if a refused attempt
    // stored one, stands. Clearing is idempotent, so it is retried once: a correct password as the
    // last allowed attempt would otherwise leave the account refusing its owner for the window.
    // Rejects when the database still fails: the caller decides.
    async recordSuccess(ip: string, email: string, countedAt: number, now = Date.now()) {
      const client = await database();
      const clear = () => client.authThrottle.deleteMany({ where: { key: accountKey(email) } });
      await Promise.all([
        clear().catch((error: unknown) => {
          console.error("auth throttle success clear failed, retrying once", error);
          return clear();
        }),
        refundKey(client, ipKey(ip), countedAt, now),
      ]);
    },
    // Gives back an attempt whose password was never judged (the check failed for infrastructure
    // reasons), on both keys. Two single-row statements, so a refund holds one row lock at a time;
    // if only one applies, the other key keeps a count, which errs toward refusing. Rejects when the
    // database fails: the caller decides.
    async refund(ip: string, email: string, countedAt: number, now = Date.now()) {
      const client = await database();
      await Promise.all([refundKey(client, accountKey(email), countedAt, now), refundKey(client, ipKey(ip), countedAt, now)]);
    },
    cleanup,
  };
}

// Every namespace the app writes, so tools (the e2e setup) can purge them by prefix.
export const THROTTLE_NAMESPACES = { login: "login", reset: "reset" } as const;

export const loginRateLimiter = createLoginRateLimiter({
  namespace: THROTTLE_NAMESPACES.login,
  windowMs: 15 * 60_000,
  maxPerAccount: 5,
  maxPerIp: 20,
});

// Forgotten-password requests: each request counts (there is no success to refund), so an address
// cannot be flooded with emails.
export const passwordResetRateLimiter = createLoginRateLimiter({
  namespace: THROTTLE_NAMESPACES.reset,
  windowMs: 15 * 60_000,
  maxPerAccount: 3,
  maxPerIp: 10,
});
