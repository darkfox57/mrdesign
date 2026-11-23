import "server-only";
import { contact as contactDetails } from "@/content/contact";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { escapeHtml, type ContactData } from "./contact-form";

// Visitor text goes into header-like fields (subject, reply-to name): no control characters there.
const CONTROL_CHARS = /[\u0000-\u001f\u007f]+/g;
const singleLine = (value: string) => value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();

// Emails the team about a new contact message through Brevo. The key is server-only (BREVO_API_KEY).
// The message is already stored before this runs, so a failure here only loses the notification.
// Runs after the response (after()), so it never throws: sendBrevoEmail logs and gives up.
export async function notifyNewContact(contact: ContactData, locale: string) {
  const rows: Array<[string, string | null]> = [
    ["Nombre", contact.name],
    ["Email", contact.email],
    ["Empresa", contact.company],
    ["Teléfono", contact.phone],
    ["Tipo de proyecto", contact.projectType],
    ["Idioma del sitio", locale],
  ];
  const htmlContent = [
    "<h1>Nuevo mensaje de contacto</h1>",
    ...rows.filter(([, value]) => value).map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value!)}</p>`),
    `<p><strong>Mensaje:</strong></p><p>${escapeHtml(contact.message).replace(/\n/g, "<br>")}</p>`,
  ].join("\n");

  const name = singleLine(contact.name);
  await sendBrevoEmail("contact notification", {
    to: [{ email: process.env.CONTACT_NOTIFY_EMAIL ?? contactDetails.email }],
    replyTo: { email: contact.email, name },
    subject: `Nuevo contacto: ${name}`,
    htmlContent,
  });
}
