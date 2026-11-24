// @vitest-environment node
import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInEmail, consume, recordSuccess, redirect } = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  consume: vi.fn(),
  recordSuccess: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.60" }) }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({ auth: { api: { signInEmail } } }));
// The limiter's own behaviour is pinned against Postgres in login-rate-limit.integration.test.ts.
vi.mock("@/lib/auth/login-rate-limit", () => ({ loginRateLimiter: { consume, recordSuccess } }));

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
    consume.mockResolvedValue({ allowed: true });
    recordSuccess.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("refuses the attempt when it cannot be counted (fail closed), without trying the password", async () => {
    consume.mockResolvedValue({ allowed: false, unavailable: true, retryAfterSeconds: 60 });

    expect(await signIn({}, form())).toEqual({
      error: "No pudimos verificar el ingreso. Prueba de nuevo en unos minutos.",
      email: "ana@mrdesign.agency",
    });
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("tells a locked visitor when to try again, without trying the password", async () => {
    consume.mockResolvedValue({ allowed: false, retryAfterSeconds: 61 });

    expect(await signIn({}, form())).toEqual({ error: "Demasiados intentos. Prueba de nuevo en 2 min.", email: "ana@mrdesign.agency" });
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("counts the attempt against the client address and the lower-cased account before checking the password", async () => {
    signInEmail.mockImplementation(async () => {
      expect(consume).toHaveBeenCalledWith("203.0.113.60", "ana@mrdesign.agency", expect.any(Number));
      throw new APIError("UNAUTHORIZED");
    });

    expect(await signIn({}, form("Ana@MRDesign.agency"))).toEqual({ error: "Email o contraseña incorrectos.", email: "Ana@MRDesign.agency" });
    expect(signInEmail).toHaveBeenCalledTimes(1);
    expect(recordSuccess).not.toHaveBeenCalled();
  });

  it("records a success with the time the attempt was counted, then redirects", async () => {
    signInEmail.mockResolvedValue({});

    await expect(signIn({}, form())).rejects.toThrow("NEXT_REDIRECT /admin");
    const countedAt = consume.mock.calls[0][2];
    expect(recordSuccess).toHaveBeenCalledWith("203.0.113.60", "ana@mrdesign.agency", countedAt);
  });

  it("still redirects a signed-in user when the success cannot be recorded, and logs it", async () => {
    const outage = new Error("connect ECONNREFUSED 127.0.0.1:5434");
    signInEmail.mockResolvedValue({});
    recordSuccess.mockRejectedValue(outage);

    await expect(signIn({}, form())).rejects.toThrow("NEXT_REDIRECT /admin");
    expect(console.error).toHaveBeenCalledWith("login throttle success write failed", outage);
  });

  // Same race as B1 on the reset form: with counting after an awaited check, parallel guesses all
  // reached the password check. An atomic counter (like the database upsert) lets 5 through.
  it("checks at most 5 passwords when 30 wrong guesses arrive at once", async () => {
    let attempts = 0;
    consume.mockImplementation(async () => (++attempts <= 5 ? { allowed: true } : { allowed: false, retryAfterSeconds: 900 }));
    signInEmail.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      throw new APIError("UNAUTHORIZED");
    });

    const answers = await Promise.all(Array.from({ length: 30 }, (_, i) => signIn({}, form("ana@mrdesign.agency", `guess-${i}`))));

    expect(signInEmail).toHaveBeenCalledTimes(5);
    expect(answers.filter((answer) => answer.error?.startsWith("Demasiados intentos."))).toHaveLength(25);
  });
});
