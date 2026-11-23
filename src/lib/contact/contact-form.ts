import { z } from "zod";
import { serviceIds } from "@/content/services";

// Error codes map to Contact.errors.* messages, so the page shows them in its own language.
export type ContactErrorCode =
  | "name"
  | "email"
  | "company"
  | "phone"
  | "projectType"
  | "message"
  | "messageTooLong"
  | "consent";
export type ContactField = "name" | "email" | "company" | "phone" | "projectType" | "message" | "consent";

// What the visitor wants built: one of the services on the site, or something else.
export const projectTypes = [...serviceIds, "other"] as const;
export type ProjectType = (typeof projectTypes)[number];
export type ContactData = {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  projectType: ProjectType;
  message: string;
};

export const MESSAGE_MAX_LENGTH = 2000;

const optional = z
  .string()
  .trim()
  .transform((value) => value || null);

const schema = z.object({
  name: z.string().trim().min(2, "name").max(120, "name"),
  // Trim before checking the format: autofill often leaves surrounding spaces.
  email: z.string().trim().max(254, "email").pipe(z.email("email")).transform((email) => email.toLowerCase()),
  company: optional.pipe(z.string().max(160, "company").nullable()),
  // International formats: digits, spaces, dashes, dots, parentheses and a leading +.
  phone: optional.pipe(z.string().regex(/^\+?[\d\s().-]{7,20}$/, "phone").nullable()),
  projectType: z.enum(projectTypes, "projectType"),
  message: z.string().trim().min(10, "message").max(MESSAGE_MAX_LENGTH, "messageTooLong"),
  consent: z.literal("on", "consent"),
});

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
};

export type ParsedContact =
  | { ok: true; data: ContactData }
  | { ok: false; spam: true }
  | { ok: false; errors: Partial<Record<ContactField, ContactErrorCode>> };

export function parseContactForm(data: FormData): ParsedContact {
  // Honeypot: hidden from people, filled by bots. Treated as spam without field errors.
  if (text(data, "website").trim()) return { ok: false, spam: true };

  const result = schema.safeParse({
    name: text(data, "name"),
    email: text(data, "email"),
    company: text(data, "company"),
    phone: text(data, "phone"),
    projectType: text(data, "projectType"),
    message: text(data, "message"),
    consent: data.get("consent") ?? undefined,
  });

  if (result.success) {
    const { name, email, company, phone, projectType, message } = result.data;
    return { ok: true, data: { name, email, company, phone, projectType, message } };
  }

  const errors: Partial<Record<ContactField, ContactErrorCode>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ContactField;
    errors[field] ??= issue.message as ContactErrorCode;
  }
  return { ok: false, errors };
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

// For the notification email: visitor input is shown as text, never interpreted as markup.
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}
