import { describe, expect, it } from "vitest";
import { serviceIds } from "@/content/services";
import { escapeHtml, parseContactForm } from "./contact-form";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const valid = {
  name: "Ana Pérez",
  email: "Ana@Example.com",
  company: "",
  phone: "",
  message: "Necesitamos migrar nuestra tienda a Shopify.",
  projectType: "shopify",
  consent: "on",
  website: "",
};

describe("parseContactForm", () => {
  it("accepts a valid submission, trims it and lowercases the email", () => {
    const result = parseContactForm(form({ ...valid, name: "  Ana Pérez  " }));
    expect(result).toEqual({
      ok: true,
      data: {
        name: "Ana Pérez",
        email: "ana@example.com",
        company: null,
        phone: null,
        projectType: "shopify",
        message: valid.message,
      },
    });
  });

  it("accepts international phone formats and keeps optional fields", () => {
    const result = parseContactForm(form({ ...valid, phone: "+33 6 12 34 56 78", company: "Acme" }));
    expect(result.ok && result.data).toMatchObject({ phone: "+33 6 12 34 56 78", company: "Acme" });
  });

  it("returns one error code per invalid field", () => {
    const result = parseContactForm(form({ name: "", email: "no-es-email", phone: "abc", message: "corto", website: "" }));
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "name",
        email: "email",
        phone: "phone",
        projectType: "projectType",
        message: "message",
        consent: "consent",
      },
    });
  });

  it("rejects messages over 2000 characters", () => {
    const result = parseContactForm(form({ ...valid, message: "a".repeat(2001) }));
    expect(result).toEqual({ ok: false, errors: { message: "messageTooLong" } });
  });

  it("accepts an email with surrounding spaces, as autofill often leaves them", () => {
    const result = parseContactForm(form({ ...valid, email: "  ana@example.com " }));
    expect(result.ok && result.data.email).toBe("ana@example.com");
  });

  it("reports a too long company as a visible field error", () => {
    expect(parseContactForm(form({ ...valid, company: "x".repeat(161) }))).toEqual({
      ok: false,
      errors: { company: "company" },
    });
  });

  it("accepts every service as project type, plus other", () => {
    for (const projectType of [...serviceIds, "other"]) {
      const result = parseContactForm(form({ ...valid, projectType }));
      expect(result.ok && result.data.projectType).toBe(projectType);
    }
  });

  it("rejects a project type that is not offered", () => {
    expect(parseContactForm(form({ ...valid, projectType: "crypto-exchange" }))).toEqual({
      ok: false,
      errors: { projectType: "projectType" },
    });
  });

  it("flags a filled honeypot as spam without reporting field errors", () => {
    expect(parseContactForm(form({ ...valid, website: "https://spam.example" }))).toEqual({ ok: false, spam: true });
  });
});

describe("escapeHtml", () => {
  it("escapes markup so the notification email shows it as text", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')"> & co`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; co",
    );
  });
});
