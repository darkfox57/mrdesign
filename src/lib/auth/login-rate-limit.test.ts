// @vitest-environment node
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp } from "../client-ip";
import { createLoginRateLimiter, throttleKey, type ThrottleDb } from "./login-rate-limit";

describe("clientIp", () => {
  it("uses the entry added by the proxy (the last one), not the one the client sent", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip and then to a constant", () => {
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

// Tests, e2e cleanups and the unlock recipe in docs/admin.md all derive keys this way.
describe("throttleKey", () => {
  const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

  it("keeps the namespace and kind in clear text and hashes the lower-cased email", () => {
    expect(throttleKey("login", "acct", "Ana@MRDesign.agency")).toBe(`login:acct:${sha256("ana@mrdesign.agency")}`);
  });

  it("hashes the address as it arrives", () => {
    expect(throttleKey("reset", "ip", "2001:db8::1")).toBe(`reset:ip:${sha256("2001:db8::1")}`);
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
  const unavailable = { allowed: false, unavailable: true, retryAfterSeconds: 60 };

  it("fails closed: an attempt that cannot be counted is refused, and the error is logged", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await limiter.consume("198.18.0.1", "a@x.com")).toEqual(unavailable);
    expect(log).toHaveBeenCalledWith("auth throttle write failed", outage);
  });

  it("fails closed when the count statement returns fewer rows than keys", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const rows of [[], [{ key: throttleKey("unit", "acct", "a@x.com"), attempts: 1, lockedUntil: null }]]) {
      const db = { ...brokenDb, $queryRaw: vi.fn().mockResolvedValue(rows) } as unknown as ThrottleDb;
      const l = createLoginRateLimiter({ namespace: "unit", windowMs: 60_000, maxPerAccount: 5, maxPerIp: 20, db });

      expect(await l.consume("198.18.0.1", "a@x.com")).toEqual(unavailable);
    }
    expect(log).toHaveBeenCalledWith("auth throttle write failed", expect.any(Error));
  });

  it("lets recordSuccess and refund reject, so the caller decides", async () => {
    await expect(limiter.recordSuccess("198.18.0.1", "a@x.com", Date.now())).rejects.toBe(outage);
    await expect(limiter.refund("198.18.0.1", "a@x.com", Date.now())).rejects.toBe(outage);
  });
});
