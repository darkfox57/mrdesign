// @vitest-environment node
import { describe, expect, it } from "vitest";
import { INGEST_MAX_REQUESTS, INGEST_RETRY_AFTER_SECONDS, INGEST_WINDOW_MS, takeIngestRequest } from "./ingest-rate-limit";

describe("ingest request limit (A10)", () => {
  it("is 60 requests per hour per key, with Retry-After in whole seconds", () => {
    expect(INGEST_MAX_REQUESTS).toBe(60);
    expect(INGEST_WINDOW_MS).toBe(60 * 60_000);
    expect(INGEST_RETRY_AFTER_SECONDS).toBe(3600);
    expect(Number.isInteger(INGEST_RETRY_AFTER_SECONDS)).toBe(true);
  });

  it("allows 60 requests of a key in the window, refuses the 61st and frees it after the window", () => {
    const key = `unit-${Date.now()}`;
    const start = 1_000_000;
    for (let i = 0; i < 60; i++) expect(takeIngestRequest(key, start + i)).toBe(true);
    expect(takeIngestRequest(key, start + 60)).toBe(false);
    expect(takeIngestRequest(`${key}-other`, start + 60)).toBe(true);
    expect(takeIngestRequest(key, start + INGEST_WINDOW_MS)).toBe(true);
  });
});
