// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestPasswordResetApi, check, recordFailure } = vi.hoisted(() => ({
  requestPasswordResetApi: vi.fn(),
  check: vi.fn(),
  recordFailure: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.50" }) }));
vi.mock("@/lib/auth", () => ({ auth: { api: { requestPasswordReset: requestPasswordResetApi } } }));
// The limiter's own behaviour is pinned against Postgres in login-rate-limit.integration.test.ts.
vi.mock("@/lib/auth/login-rate-limit", () => ({ passwordResetRateLimiter: { check, recordFailure } }));

const { requestPasswordReset } = await import("../password-actions");

const SENT = { sent: true };

function form(email: string) {
  const data = new FormData();
  data.set("email", email);
  return data;
}

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    check.mockResolvedValue({ allowed: true });
    recordFailure.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("answers the same for a known and an unknown email, counting each request", async () => {
    requestPasswordResetApi.mockResolvedValue({ status: true });

    expect(await requestPasswordReset({}, form("ana@mrdesign.agency"))).toEqual(SENT);
    expect(await requestPasswordReset({}, form("nadie@mrdesign.agency"))).toEqual(SENT);
    expect(recordFailure).toHaveBeenCalledWith("203.0.113.50", "nadie@mrdesign.agency");
  });

  // Some failures happen only for existing accounts (token write, email send), so a distinct answer
  // would reveal which accounts exist. Failures are logged on the server and the answer stays the same.
  it("logs a failure but answers exactly like a successful request", async () => {
    const failure = new Error("connect ECONNREFUSED 127.0.0.1:5434");
    requestPasswordResetApi.mockRejectedValue(failure);

    expect(await requestPasswordReset({}, form("ana@mrdesign.agency"))).toEqual(SENT);
    expect(console.error).toHaveBeenCalledWith("password reset request failed", failure);
  });

  it("tells a throttled visitor when to try again, without sending", async () => {
    check.mockResolvedValue({ allowed: false, retryAfterSeconds: 61 });

    expect(await requestPasswordReset({}, form("ana@mrdesign.agency"))).toEqual({
      error: "Demasiados pedidos. Prueba de nuevo en 2 min.",
      email: "ana@mrdesign.agency",
    });
    expect(requestPasswordResetApi).not.toHaveBeenCalled();
  });

  // Fail closed: an email is only sent once the request is counted. The answer stays uniform (L27).
  it("sends nothing but answers the same when the throttle cannot be read", async () => {
    check.mockResolvedValue({ allowed: false, unavailable: true, retryAfterSeconds: 60 });

    expect(await requestPasswordReset({}, form("ana@mrdesign.agency"))).toEqual(SENT);
    expect(recordFailure).not.toHaveBeenCalled();
    expect(requestPasswordResetApi).not.toHaveBeenCalled();
  });

  it("sends nothing but answers the same when the request cannot be counted, and logs it", async () => {
    const outage = new Error("connect ECONNREFUSED 127.0.0.1:5434");
    recordFailure.mockRejectedValue(outage);

    expect(await requestPasswordReset({}, form("ana@mrdesign.agency"))).toEqual(SENT);
    expect(requestPasswordResetApi).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("password reset throttle write failed", outage);
  });
});
