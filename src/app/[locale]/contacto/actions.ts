"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { routing } from "@/i18n/routing";
import { clientIp } from "@/lib/client-ip";
import { parseContactForm, type ContactErrorCode, type ContactField } from "@/lib/contact/contact-form";
import { notifyNewContact } from "@/lib/contact/notify";
import { db } from "@/lib/db";
import { createWindowRateLimiter } from "@/lib/window-rate-limit";

const VALUE_KEYS = ["name", "email", "company", "phone", "projectType", "message"] as const;

// What the visitor typed, sent back on errors: React resets the form after every action.
export type ContactValues = Partial<Record<(typeof VALUE_KEYS)[number], string>>;

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      values: ContactValues;
      errors?: Partial<Record<ContactField, ContactErrorCode>>;
      form?: "rateLimited" | "generic";
    };

const submittedValues = (formData: FormData): ContactValues =>
  Object.fromEntries(
    VALUE_KEYS.map((key) => {
      const value = formData.get(key);
      return [key, typeof value === "string" ? value : ""];
    }),
  );

// Five messages per hour per client address: enough for people, a brake for scripts.
const contactLimiter = createWindowRateLimiter({ windowMs: 60 * 60_000, max: 5 });

export async function submitContact(_: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = parseContactForm(formData);
  // Spam gets the same answer as a real submission, so bots learn nothing.
  if (!parsed.ok && "spam" in parsed) return { status: "success" };
  const values = submittedValues(formData);
  if (!parsed.ok) return { status: "error", values, errors: parsed.errors };

  if (!contactLimiter.take(clientIp(await headers()))) return { status: "error", values, form: "rateLimited" };

  const localeValue = formData.get("locale");
  const locale = routing.locales.find((l) => l === localeValue) ?? routing.defaultLocale;

  try {
    await db.contactSubmission.create({ data: { ...parsed.data, consent: true, locale } });
  } catch (error) {
    console.error("contact submission could not be stored", error);
    return { status: "error", values, form: "generic" };
  }

  // The visitor gets the answer first; the notification is sent afterwards.
  after(() => notifyNewContact(parsed.data, locale));
  return { status: "success" };
}
