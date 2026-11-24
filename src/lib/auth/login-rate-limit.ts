// Brute-force guard for the admin login server action. better-auth's own rate limit only
// covers HTTP calls to /api/auth/*, not `auth.api.*` calls made from server actions.
// In memory: enough for the single Easypanel container; use a shared store if it scales out.

type Options = { windowMs: number; maxPerAccount: number; maxPerIp: number; maxKeys?: number; maxLockedKeys?: number };
type Check = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function createLoginRateLimiter({
  windowMs,
  maxPerAccount,
  maxPerIp,
  maxKeys = 10_000,
  maxLockedKeys = 10_000,
}: Options) {
  // Two maps with their own budgets, so memory stays bounded at maxKeys + maxLockedKeys:
  // - counters: keys still under their limit. Spraying many emails evicts the oldest counters only,
  //   never a lock, or an attacker could flush a lock by spraying and resume guessing.
  // - locks: keys at their limit. Locking accounts from many addresses evicts the oldest locks only,
  //   never a counter that is still counting towards a lock.
  // A Map keeps insertion order and every write re-inserts its key, so the first entries are the
  // least recently written ones: expired entries are always evicted before live ones.
  const counters = new Map<string, number[]>();
  const locks = new Map<string, number[]>();

  const recentFailures = (key: string, now: number) =>
    (locks.get(key) ?? counters.get(key) ?? []).filter((time) => now - time < windowMs);

  const limitFor = (key: string) => (key.startsWith("account:") ? maxPerAccount : maxPerIp);

  const evictOldest = (map: Map<string, number[]>, max: number) => {
    for (const key of map.keys()) {
      if (map.size <= max) break;
      map.delete(key);
    }
  };

  const write = (key: string, times: number[]) => {
    counters.delete(key);
    locks.delete(key);
    if (!times.length) return;
    if (times.length >= limitFor(key)) {
      locks.set(key, times);
      evictOldest(locks, maxLockedKeys);
    } else {
      counters.set(key, times);
      evictOldest(counters, maxKeys);
    }
  };

  // When a bucket unlocks: once enough of its oldest failures leave the window to fall under the limit.
  const unlocksAt = (times: number[], max: number) => times[times.length - max] + windowMs;

  // The account key ignores the IP on purpose: rotating (or forging) the client address must not
  // reset an account lock. Trade-off: anyone can lock an account for one window with bad guesses.
  const accountKey = (email: string) => `account:${email.toLowerCase()}`;
  const ipKey = (ip: string) => `ip:${ip}`;

  return {
    check(ip: string, email: string, now = Date.now()): Check {
      const limits: Array<[number[], number]> = [
        [recentFailures(accountKey(email), now), maxPerAccount],
        [recentFailures(ipKey(ip), now), maxPerIp],
      ];
      const exceeded = limits.filter(([times, max]) => times.length >= max).map(([times, max]) => unlocksAt(times, max));
      if (!exceeded.length) return { allowed: true };
      // Every exceeded bucket blocks the attempt, so the wait lasts until the last one unlocks.
      return { allowed: false, retryAfterSeconds: Math.ceil((Math.max(...exceeded) - now) / 1000) };
    },
    recordFailure(ip: string, email: string, now = Date.now()) {
      for (const key of [accountKey(email), ipKey(ip)]) write(key, [...recentFailures(key, now), now]);
    },
    // A successful login clears the account. The IP counter stays: other accounts may be under attack from it.
    clear(_ip: string, email: string) {
      write(accountKey(email), []);
    },
    size: () => counters.size + locks.size,
  };
}

export const loginRateLimiter = createLoginRateLimiter({
  windowMs: 15 * 60_000,
  maxPerAccount: 5,
  maxPerIp: 20,
});

// Forgotten-password requests: each request counts, so an address cannot be flooded with emails.
export const passwordResetRateLimiter = createLoginRateLimiter({
  windowMs: 15 * 60_000,
  maxPerAccount: 3,
  maxPerIp: 10,
});
