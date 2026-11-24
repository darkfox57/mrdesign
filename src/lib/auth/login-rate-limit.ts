// Brute-force guard for the admin login and password-reset server actions. better-auth's own rate
// limit only covers HTTP calls to /api/auth/*, not `auth.api.*` calls made from server actions.
//
// Counters live in Postgres (AuthThrottle): locks survive restarts, hold across instances, and are
// never evicted by other keys, so flooding the table with locks for other accounts or addresses
// cannot release a target's lock (A1). Each key counts attempts in a fixed window that starts at its
// first attempt; past the limit the key is refused until that window ends.
//
// Attempts are counted before they are verified (B1): `consume` increments and decides in one
// statement per key, so parallel requests cannot all pass a check made before any of them counted.
import { createHash } from "node:crypto";
import { db as appDb } from "@/lib/db";

export type ThrottleDb = Pick<typeof appDb, "authThrottle" | "$executeRaw" | "$queryRaw">;

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
type Counted = { failures: number; lockedUntil: Date | null };

// Shown as "try again in a minute" when the database cannot answer.
const UNAVAILABLE_RETRY_SECONDS = 60;

// Emails and forwarded addresses are attacker-controlled and unbounded: an unhashed key over ~2704
// bytes does not fit the primary-key index, so its attempts were never counted. The hash keeps every
// key short; the namespace and kind stay readable so rows can be found and purged by prefix.
const hashed = (value: string) => createHash("sha256").update(value).digest("hex");

export function createLoginRateLimiter({
  namespace,
  windowMs,
  maxPerAccount,
  maxPerIp,
  cleanupEveryMs = 5 * 60_000,
  db = appDb,
}: Options) {
  // The account key ignores the IP on purpose: rotating (or forging) the client address must not
  // reset an account lock. Trade-off: anyone can lock an account for one window with bad guesses.
  const accountKey = (email: string) => `${namespace}:acct:${hashed(email.toLowerCase())}`;
  const ipKey = (ip: string) => `${namespace}:ip:${hashed(ip)}`;
  let lastCleanup = Number.NEGATIVE_INFINITY;

  // One statement per key, so concurrent attempts count exactly: Postgres serializes the upserts on
  // the primary key and each one returns the count after its own increment. An expired window
  // restarts at this attempt with a count of one; reaching the limit sets the lock to the end of the
  // current window. Every SET expression reads the old row.
  const count = async (key: string, max: number, now: number): Promise<Counted> => {
    const at = new Date(now);
    const windowEnd = new Date(now + windowMs);
    const expiredBefore = new Date(now - windowMs);
    const rows = await db.$queryRaw<Counted[]>`
      INSERT INTO "AuthThrottle" ("key", "failures", "windowStart", "lockedUntil", "updatedAt")
      VALUES (${key}, 1, ${at}, CASE WHEN 1 >= ${max}::integer THEN ${windowEnd}::timestamptz END, ${at})
      ON CONFLICT ("key") DO UPDATE SET
        "failures" = CASE WHEN "AuthThrottle"."windowStart" <= ${expiredBefore}::timestamptz THEN 1
                          ELSE "AuthThrottle"."failures" + 1 END,
        "windowStart" = CASE WHEN "AuthThrottle"."windowStart" <= ${expiredBefore}::timestamptz THEN ${at}::timestamptz
                             ELSE "AuthThrottle"."windowStart" END,
        "lockedUntil" = CASE
          WHEN "AuthThrottle"."windowStart" <= ${expiredBefore}::timestamptz
            THEN CASE WHEN 1 >= ${max}::integer THEN ${windowEnd}::timestamptz END
          WHEN "AuthThrottle"."failures" + 1 >= ${max}::integer
            THEN "AuthThrottle"."windowStart" + ${windowMs}::integer * interval '1 millisecond'
        END,
        "updatedAt" = ${at}::timestamptz
      RETURNING "failures", "lockedUntil"`;
    return rows[0];
  };

  // Deletes this namespace's rows whose window and lock have both ended. Returns how many went.
  const cleanup = (now = Date.now()) =>
    db.$executeRaw`
      DELETE FROM "AuthThrottle"
      WHERE starts_with("key", ${`${namespace}:`})
        AND "windowStart" <= ${new Date(now - windowMs)}::timestamptz
        AND ("lockedUntil" IS NULL OR "lockedUntil" <= ${new Date(now)}::timestamptz)`;

  return {
    // Counts the attempt on the account and the address, then decides: up to the limit is allowed,
    // past it is refused until the last exceeded key unlocks. Fails closed: an attempt that cannot be
    // counted is refused (and logged). Login needs the database anyway, and an unthrottled path is
    // what an attacker would aim for.
    async consume(ip: string, email: string, now = Date.now()): Promise<Decision> {
      let counted: Array<[Counted, number]>;
      try {
        const [account, address] = await Promise.all([count(accountKey(email), maxPerAccount, now), count(ipKey(ip), maxPerIp, now)]);
        counted = [
          [account, maxPerAccount],
          [address, maxPerIp],
        ];
      } catch (error) {
        console.error("auth throttle write failed", error);
        return { allowed: false, unavailable: true, retryAfterSeconds: UNAVAILABLE_RETRY_SECONDS };
      }
      if (now - lastCleanup >= cleanupEveryMs) {
        lastCleanup = now;
        // Housekeeping only: a failed cleanup must not change the decision.
        await cleanup(now).catch((error: unknown) => console.error("auth throttle cleanup failed", error));
      }

      const exceeded = counted.filter(([row, max]) => row.failures > max).map(([row]) => row.lockedUntil?.getTime() ?? now + windowMs);
      if (!exceeded.length) return { allowed: true };
      // Every exceeded key blocks the attempt, so the wait lasts until the last one unlocks.
      return { allowed: false, retryAfterSeconds: Math.ceil((Math.max(...exceeded) - now) / 1000) };
    },
    // A successful login clears the account and gives the address back the attempt `consume` counted
    // at `countedAt`, so successes never count against an address, as before attempts were counted
    // first. The address is not reset: other accounts may be under attack from it. Only the window
    // that counted the attempt is refunded. Rejects when the database fails: the caller decides.
    async recordSuccess(ip: string, email: string, countedAt = Date.now()) {
      await Promise.all([
        db.authThrottle.deleteMany({ where: { key: accountKey(email) } }),
        db.$executeRaw`
          UPDATE "AuthThrottle" SET
            "failures" = GREATEST("failures" - 1, 0),
            "lockedUntil" = CASE WHEN "failures" - 1 >= ${maxPerIp}::integer THEN "lockedUntil" END,
            "updatedAt" = ${new Date()}::timestamptz
          WHERE "key" = ${ipKey(ip)}
            AND "windowStart" <= ${new Date(countedAt)}::timestamptz
            AND "windowStart" > ${new Date(countedAt - windowMs)}::timestamptz`,
      ]);
    },
    cleanup,
  };
}

export const loginRateLimiter = createLoginRateLimiter({
  namespace: "login",
  windowMs: 15 * 60_000,
  maxPerAccount: 5,
  maxPerIp: 20,
});

// Forgotten-password requests: each request counts (there is no success to refund), so an address
// cannot be flooded with emails.
export const passwordResetRateLimiter = createLoginRateLimiter({
  namespace: "reset",
  windowMs: 15 * 60_000,
  maxPerAccount: 3,
  maxPerIp: 10,
});
