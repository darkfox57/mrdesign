// Brute-force guard for the admin login and password-reset server actions. better-auth's own rate
// limit only covers HTTP calls to /api/auth/*, not `auth.api.*` calls made from server actions.
//
// Counters live in Postgres (AuthThrottle): locks survive restarts, hold across instances, and are
// never evicted by other keys, so flooding the table with locks for other accounts or addresses
// cannot release a target's lock (A1). Each key counts failures in a fixed window that starts at its
// first failure; at the limit the key locks until that window ends.
import { db as appDb } from "@/lib/db";

export type ThrottleDb = Pick<typeof appDb, "authThrottle" | "$executeRaw">;

type Options = {
  // Prefix of every key, so the login and reset limiters (and tests) never share rows.
  namespace: string;
  windowMs: number;
  maxPerAccount: number;
  maxPerIp: number;
  // Expired rows are deleted from recordFailure at most this often per process.
  cleanupEveryMs?: number;
  db?: ThrottleDb;
};

type Check = { allowed: true } | { allowed: false; retryAfterSeconds: number; unavailable?: true };

// Shown as "try again in a minute" when the database cannot answer.
const UNAVAILABLE_RETRY_SECONDS = 60;

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
  const accountKey = (email: string) => `${namespace}:acct:${email.toLowerCase()}`;
  const ipKey = (ip: string) => `${namespace}:ip:${ip}`;
  let lastCleanup = Number.NEGATIVE_INFINITY;

  // One statement per key, so concurrent failures count exactly: Postgres serializes the upserts
  // on the primary key. An expired window restarts at this failure with a count of one; reaching the
  // limit sets the lock to the end of the current window. Every SET expression reads the old row.
  const countFailure = (key: string, max: number, now: number) => {
    const at = new Date(now);
    const windowEnd = new Date(now + windowMs);
    const expiredBefore = new Date(now - windowMs);
    return db.$executeRaw`
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
        "updatedAt" = ${at}::timestamptz`;
  };

  // Deletes this namespace's rows whose window and lock have both ended. Returns how many went.
  const cleanup = (now = Date.now()) =>
    db.$executeRaw`
      DELETE FROM "AuthThrottle"
      WHERE starts_with("key", ${`${namespace}:`})
        AND "windowStart" <= ${new Date(now - windowMs)}::timestamptz
        AND ("lockedUntil" IS NULL OR "lockedUntil" <= ${new Date(now)}::timestamptz)`;

  return {
    // Fails closed: if the database cannot answer, the attempt is refused (and logged). Login needs
    // the database anyway, and an unthrottled path is what an attacker would aim for.
    async check(ip: string, email: string, now = Date.now()): Promise<Check> {
      try {
        const locks = await db.authThrottle.findMany({
          where: { key: { in: [accountKey(email), ipKey(ip)] }, lockedUntil: { gt: new Date(now) } },
          select: { lockedUntil: true },
        });
        if (!locks.length) return { allowed: true };
        // Every locked key blocks the attempt, so the wait lasts until the last one unlocks.
        const unlocksAt = Math.max(...locks.map((lock) => lock.lockedUntil!.getTime()));
        return { allowed: false, retryAfterSeconds: Math.ceil((unlocksAt - now) / 1000) };
      } catch (error) {
        console.error("auth throttle check failed", error);
        return { allowed: false, unavailable: true, retryAfterSeconds: UNAVAILABLE_RETRY_SECONDS };
      }
    },
    // Rejects when the database fails: the caller decides what that means for its flow.
    async recordFailure(ip: string, email: string, now = Date.now()) {
      await Promise.all([countFailure(accountKey(email), maxPerAccount, now), countFailure(ipKey(ip), maxPerIp, now)]);
      if (now - lastCleanup >= cleanupEveryMs) {
        lastCleanup = now;
        // Housekeeping only: a failed cleanup must not turn a counted failure into an error.
        await cleanup(now).catch((error: unknown) => console.error("auth throttle cleanup failed", error));
      }
    },
    // A successful login clears the account. The IP counter stays: other accounts may be under attack from it.
    async clear(_ip: string, email: string) {
      await db.authThrottle.deleteMany({ where: { key: accountKey(email) } });
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

// Forgotten-password requests: each request counts, so an address cannot be flooded with emails.
export const passwordResetRateLimiter = createLoginRateLimiter({
  namespace: "reset",
  windowMs: 15 * 60_000,
  maxPerAccount: 3,
  maxPerIp: 10,
});
