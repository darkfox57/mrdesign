// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestPasswordResetApi } = vi.hoisted(() => ({ requestPasswordResetApi: vi.fn() }));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.50" }) }));
vi.mock("@/lib/auth", () => ({ auth: { api: { requestPasswordReset: requestPasswordResetApi } } }));

const SENT = { sent: true };

function form(email: string) {
  const data = new FormData();
  data.set("email", email);
  return data;
}

// The limiter is module state: a fresh module per test keeps the counts apart.
async function loadAction() {
  vi.resetModules();
  return (await import("../password-actions")).requestPasswordReset;
}

describe("requestPasswordReset", () => {
  beforeEach(() => {
    requestPasswordResetApi.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("answers the same for a known and an unknown email", async () => {
    const requestPasswordReset = await loadAction();
    requestPasswordResetApi.mockResolvedValue({ status: true });

    expect(await requestPasswordReset({}, form("ana@mrdesign.agency"))).toEqual(SENT);
    expect(await requestPasswordReset({}, form("nadie@mrdesign.agency"))).toEqual(SENT);
  });

  // Some failures happen only for existing accounts (token write, email send), so a distinct answer
  // would reveal which accounts exist. Failures are logged on the server and the answer stays the same.
  it("logs a failure but answers exactly like a successful request", async () => {
    const requestPasswordReset = await loadAction();
    const failure = new Error("connect ECONNREFUSED 127.0.0.1:5434");
    requestPasswordResetApi.mockRejectedValue(failure);

    expect(await requestPasswordReset({}, form("ana@mrdesign.agency"))).toEqual(SENT);
    expect(console.error).toHaveBeenCalledWith("password reset request failed", failure);
  });
});
