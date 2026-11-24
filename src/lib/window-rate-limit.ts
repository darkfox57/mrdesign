// Fixed-window counter per key (for example, per client IP). In memory: enough for the single
// Dokploy container; use a shared store if the app scales out.
type Options = { windowMs: number; max: number; maxKeys?: number };

export function createWindowRateLimiter({ windowMs, max, maxKeys = 10_000 }: Options) {
  // Map keeps insertion order, so the first keys are the least recently written ones.
  const hits = new Map<string, number[]>();

  return {
    // Records an attempt and returns whether it is allowed.
    take(key: string, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      const allowed = recent.length < max;
      if (allowed) recent.push(now);
      hits.delete(key);
      hits.set(key, recent);
      for (const oldest of hits.keys()) {
        if (hits.size <= maxKeys) break;
        hits.delete(oldest);
      }
      return allowed;
    },
    size: () => hits.size,
  };
}
