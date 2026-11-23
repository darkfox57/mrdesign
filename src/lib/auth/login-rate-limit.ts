// Brute-force guard for the admin login server action. better-auth's own rate limit only
// covers HTTP calls to /api/auth/*, not `auth.api.*` calls made from server actions.
// In memory: enough for the single Easypanel container; use a shared store if it scales out.

type Options = { windowMs: number; maxPerAccount: number; maxPerIp: number; maxKeys?: number };
type Check = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function createLoginRateLimiter({ windowMs, maxPerAccount, maxPerIp, maxKeys = 10_000 }: Options) {
  // Map keeps insertion order, so the first keys are the least recently written ones.
  const failures = new Map<string, number[]>();

  const recentFailures = (key: string, now: number) =>
    (failures.get(key) ?? []).filter((time) => now - time < windowMs);

  const limitFor = (key: string) => (key.startsWith("account:") ? maxPerAccount : maxPerIp);

  const write = (key: string, times: number[]) => {
    failures.delete(key);
    if (times.length) failures.set(key, times);
    // Spraying many emails must not grow memory without bound: evict the oldest keys, but never a
    // locked one, or an attacker could flush a lock by spraying and resume guessing. Locked keys can
    // push the map past maxKeys; each lock costs maxPerAccount attempts, capped per IP.
    for (const [candidate, candidateTimes] of failures) {
      if (failures.size <= maxKeys) break;
      if (candidateTimes.length < limitFor(candidate)) failures.delete(candidate);
    }
  };

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
      const exceeded = limits.filter(([times, max]) => times.length >= max).map(([times]) => times[0]);
      if (!exceeded.length) return { allowed: true };
      return { allowed: false, retryAfterSeconds: Math.ceil((Math.min(...exceeded) + windowMs - now) / 1000) };
    },
    recordFailure(ip: string, email: string, now = Date.now()) {
      for (const key of [accountKey(email), ipKey(ip)]) write(key, [...recentFailures(key, now), now]);
    },
    // A successful login clears the account. The IP counter stays: other accounts may be under attack from it.
    clear(_ip: string, email: string) {
      failures.delete(accountKey(email));
    },
    size: () => failures.size,
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
