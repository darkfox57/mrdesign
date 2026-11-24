// @vitest-environment node
import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInEmail, check, recordFailure, clear, redirect } = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  check: vi.fn(),
  recordFailure: vi.fn(),
  clear: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.60" }) }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({ auth: { api: { signInEmail } } }));
// The limiter's own behaviour is pinned against Postgres in login-rate-limit.integration.test.ts.
vi.mock("@/lib/auth/login-rate-limit", () => ({ loginRateLimiter: { check, recordFailure, clear } }));

const { signIn } = await import("./actions");

function form(email = "ana@mrdesign.agency", password = "a-password-123") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

describe("signIn throttling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    check.mockResolvedValue({ allowed: true });
    recordFailure.mockResolvedValue(undefined);
    clear.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("refuses the attempt when the throttle cannot answer (fail closed), without trying the password", async () => {
    check.mockResolvedValue({ allowed: false, unavailable: true, retryAfterSeconds: 60 });

    expect(await signIn({}, form())).toEqual({
      error: "No pudimos verificar el ingreso. Prueba de nuevo en unos minutos.",
      email: "ana@mrdesign.agency",
    });
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("tells a locked visitor when to try again", async () => {
    check.mockResolvedValue({ allowed: false, retryAfterSeconds: 61 });

    expect(await signIn({}, form())).toEqual({ error: "Demasiados intentos. Prueba de nuevo en 2 min.", email: "ana@mrdesign.agency" });
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("counts a wrong password against the client address and the lower-cased account", async () => {
    signInEmail.mockRejectedValue(new APIError("UNAUTHORIZED"));

    expect(await signIn({}, form("Ana@MRDesign.agency"))).toEqual({ error: "Email o contraseña incorrectos.", email: "Ana@MRDesign.agency" });
    expect(recordFailure).toHaveBeenCalledWith("203.0.113.60", "ana@mrdesign.agency");
  });

  it("answers a wrong password the same way when the failure cannot be counted, and logs it", async () => {
    const outage = new Error("connect ECONNREFUSED 127.0.0.1:5434");
    signInEmail.mockRejectedValue(new APIError("UNAUTHORIZED"));
    recordFailure.mockRejectedValue(outage);

    expect(await signIn({}, form())).toEqual({ error: "Email o contraseña incorrectos.", email: "ana@mrdesign.agency" });
    expect(console.error).toHaveBeenCalledWith("login throttle write failed", outage);
  });

  it("still redirects a signed-in user when the counter cannot be cleared, and logs it", async () => {
    const outage = new Error("connect ECONNREFUSED 127.0.0.1:5434");
    signInEmail.mockResolvedValue({});
    clear.mockRejectedValue(outage);

    await expect(signIn({}, form())).rejects.toThrow("NEXT_REDIRECT /admin");
    expect(clear).toHaveBeenCalledWith("203.0.113.60", "ana@mrdesign.agency");
    expect(console.error).toHaveBeenCalledWith("login throttle clear failed", outage);
  });
});
