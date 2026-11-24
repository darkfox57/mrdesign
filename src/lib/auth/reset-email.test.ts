// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type BrevoBody = { sender: { email: string }; to: { email: string; name?: string }[]; subject: string; htmlContent: string };

function stubBrevo() {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  return () => JSON.parse(fetchMock.mock.calls[0][1].body as string) as BrevoBody;
}

describe("sendPasswordResetEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("emails the reset link to the user through Brevo", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-key");
    vi.stubEnv("BETTER_AUTH_URL", "https://mrdesign.agency");
    // Stubbed, so a sender configured on the machine running the tests cannot change the result.
    vi.stubEnv("CONTACT_SENDER_EMAIL", "sender@mrdesign.test");
    const body = stubBrevo();
    const { sendPasswordResetEmail } = await import("./reset-email");

    await sendPasswordResetEmail({ email: "ana@mrdesign.agency", name: "Ana" }, "tok123");

    const sent = body();
    expect(sent.to).toEqual([{ email: "ana@mrdesign.agency", name: "Ana" }]);
    expect(sent.sender.email).toBe("sender@mrdesign.test");
    expect(sent.subject).toBe("Restablece tu contraseña del panel de MR Design");
    expect(sent.htmlContent).toContain('href="https://mrdesign.agency/admin/restablecer?token=tok123"');
    expect(sent.htmlContent).toContain("vence en 1 hora");
  });

  it("escapes the user's name in the email body", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-key");
    const body = stubBrevo();
    const { sendPasswordResetEmail } = await import("./reset-email");

    await sendPasswordResetEmail({ email: "x@mrdesign.agency", name: '<img src=x onerror="alert(1)">' }, "t");

    expect(body().htmlContent).not.toContain("<img");
    expect(body().htmlContent).toContain("&lt;img");
  });

  it("keeps control characters out of the recipient name", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-key");
    const body = stubBrevo();
    const { sendPasswordResetEmail } = await import("./reset-email");

    await sendPasswordResetEmail({ email: "x@mrdesign.agency", name: "Ana\r\nBcc: otro@evil.com" }, "t");

    expect(body().to[0].name).toBe("Ana Bcc: otro@evil.com");
  });

  it("does not throw when Brevo is not configured or cannot be reached", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("BREVO_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { sendPasswordResetEmail } = await import("./reset-email");
    await expect(sendPasswordResetEmail({ email: "x@mrdesign.agency", name: "X" }, "t")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("BREVO_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(sendPasswordResetEmail({ email: "x@mrdesign.agency", name: "X" }, "t")).resolves.toBeUndefined();
  });
});

describe("queuePasswordResetEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns at once without waiting for Brevo, so the form answers as fast for an existing account as for an unknown one", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-key");
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    const { queuePasswordResetEmail } = await import("./reset-email");

    const result = queuePasswordResetEmail({ email: "ana@mrdesign.agency", name: "Ana" }, "tok");

    expect(result).toBeUndefined();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  });
});

