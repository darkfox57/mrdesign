import { createWindowRateLimiter } from "@/lib/window-rate-limit";

// Request limit of POST /api/blog per API key (assumption A10): 60 requests per hour, counted per
// key id after the key is authenticated. In memory, so the count is per container and starts over
// on a restart; that is enough for the single Dokploy container (docs/api-blog.md).
export const INGEST_MAX_REQUESTS = 60;
export const INGEST_WINDOW_MS = 60 * 60_000;

// The limiter does not say when the oldest counted request leaves the window, so Retry-After is the
// whole window: the longest a refused key ever has to wait.
export const INGEST_RETRY_AFTER_SECONDS = Math.ceil(INGEST_WINDOW_MS / 1000);

const ingestLimiter = createWindowRateLimiter({ windowMs: INGEST_WINDOW_MS, max: INGEST_MAX_REQUESTS });

// Records a request of the key and returns whether it is allowed.
export function takeIngestRequest(keyId: string, now?: number) {
  return ingestLimiter.take(keyId, now);
}
