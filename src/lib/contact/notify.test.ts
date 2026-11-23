// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// The name has an "s" and spaces on purpose: cleaning must only touch control characters.
const contact = { name: "Ana Torres\r\nBcc: x@evil.com", email: "ana@example.com", company: null, phone: null, projectType: "wordpress", message: "Hola" } as const;

describe("notifyNewContact", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not throw when Brevo cannot be reached", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { notifyNewContact } = await import("./notify");

    await expect(notifyNewContact(contact, "es")).resolves.toBeUndefined();
  });

  it("strips control characters from the visitor name in the subject and reply-to", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const { notifyNewContact } = await import("./notify");

    await notifyNewContact(contact, "es");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.subject).toBe("Nuevo contacto: Ana Torres Bcc: x@evil.com");
    expect(body.replyTo.name).not.toMatch(/[\r\n]/);
  });
});
