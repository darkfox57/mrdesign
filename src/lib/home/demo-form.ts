// Live validation of the home's demo form (a "piece" that sends nothing). The real contact form
// validates on the server (src/lib/contact/contact-form.ts); this one only shows how it feels.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

export type EmailStatus = "idle" | "ok" | "error";

// A valid address is confirmed as it is typed; an invalid one is flagged only after the visitor
// leaves the field, so nobody is scolded halfway through typing.
export function emailStatus(value: string, touched: boolean): EmailStatus {
  if (isValidEmail(value)) return "ok";
  return touched ? "error" : "idle";
}

export function firstName(name: string): string | null {
  return name.trim().split(/\s+/)[0] || null;
}
