// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestPasswordResetApi, consume } = vi.hoisted(() => ({
  requestPasswordResetApi: vi.fn(),
  consume: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.50" }) }));
vi.mock("@/lib/auth", () => ({ auth: { api: { requestPasswordReset: requestPasswordResetApi } } }));
// The limiter's own behaviour is pinned against Postgres in login-rate-limit.integration.test.ts.
vi.mock("@/lib/auth/login-rate-limit", () => ({ passwordResetRateLimiter: { consume } }));

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
    consume.mockResolvedValue({ allowed: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("answers the same for a known and an unknown email, counting each request", async () => {
    requestPasswordResetApi.mockResolvedValue({ status: true });

    expect(await requestPasswordReset({}, form("ana@mrdesign.com.co"))).toEqual(SENT);
    expect(await requestPasswordReset({}, form("nadie@mrdesign.com.co"))).toEqual(SENT);
    expect(consume).toHaveBeenCalledWith("203.0.113.50", "nadie@mrdesign.com.co");
  });

  // Some failures happen only for existing accounts (token write, email send), so a distinct answer
  // would reveal which accounts exist. Failures are logged on the server and the answer stays the same.
  it("logs a failure but answers exactly like a successful request", async () => {
    const failure = new Error("connect ECONNREFUSED 127.0.0.1:5434");
    requestPasswordResetApi.mockRejectedValue(failure);

    expect(await requestPasswordReset({}, form("ana@mrdesign.com.co"))).toEqual(SENT);
    expect(console.error).toHaveBeenCalledWith("password reset request failed", failure);
  });

  it("tells a throttled visitor when to try again, without sending", async () => {
    consume.mockResolvedValue({ allowed: false, retryAfterSeconds: 61 });

    expect(await requestPasswordReset({}, form("ana@mrdesign.com.co"))).toEqual({
      error: "Demasiados pedidos. Prueba de nuevo en 2 min.",
      email: "ana@mrdesign.com.co",
    });
    expect(requestPasswordResetApi).not.toHaveBeenCalled();
  });

  // Fail closed: an email is only sent once the request is counted. The answer stays uniform (L27).
  it("sends nothing but answers the same when the request cannot be counted", async () => {
    consume.mockResolvedValue({ allowed: false, unavailable: true, retryAfterSeconds: 60 });

    expect(await requestPasswordReset({}, form("ana@mrdesign.com.co"))).toEqual(SENT);
    expect(requestPasswordResetApi).not.toHaveBeenCalled();
  });
});
