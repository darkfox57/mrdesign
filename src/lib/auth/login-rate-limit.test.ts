// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp } from "../client-ip";
import { createLoginRateLimiter, type ThrottleDb } from "./login-rate-limit";

describe("clientIp", () => {
  it("uses the entry added by the proxy (the last one), not the one the client sent", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip and then to a constant", () => {
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

// The behaviour against Postgres lives in login-rate-limit.integration.test.ts.
describe("login rate limiter when the database fails", () => {
  afterEach(() => vi.restoreAllMocks());

  const outage = new Error("connect ECONNREFUSED 127.0.0.1:5434");
  const brokenDb = {
    authThrottle: { deleteMany: vi.fn().mockRejectedValue(outage) },
    $queryRaw: vi.fn().mockRejectedValue(outage),
    $executeRaw: vi.fn().mockRejectedValue(outage),
  } as unknown as ThrottleDb;
  const limiter = createLoginRateLimiter({ namespace: "unit", windowMs: 60_000, maxPerAccount: 5, maxPerIp: 20, db: brokenDb });

  it("fails closed: an attempt that cannot be counted is refused, and the error is logged", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await limiter.consume("1.1.1.1", "a@x.com")).toEqual({ allowed: false, unavailable: true, retryAfterSeconds: 60 });
    expect(log).toHaveBeenCalledWith("auth throttle write failed", outage);
  });

  it("lets recordSuccess reject, so the caller decides", async () => {
    await expect(limiter.recordSuccess("1.1.1.1", "a@x.com")).rejects.toBe(outage);
  });
});
