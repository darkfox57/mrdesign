import "server-only";
import { escapeHtml } from "@/lib/contact/contact-form";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { RESET_PASSWORD_PATH, RESET_TOKEN_SECONDS } from "./reset-config";

// The link goes to the dashboard's own reset page, not to better-auth's HTTP callback (closed in
// src/app/api/auth/[...all]/route.ts so every reset goes through the rate-limited server actions).
export async function sendPasswordResetEmail(user: { email: string; name: string }, token: string) {
  const origin = (process.env.BETTER_AUTH_URL ?? "https://mrdesign.com.co").replace(/\/+$/, "");
  const link = `${origin}${RESET_PASSWORD_PATH}?token=${encodeURIComponent(token)}`;
  const name = escapeHtml(user.name);

  await sendBrevoEmail("password reset email", {
    // The display name goes into a header-like field: no control characters there.
    to: [{ email: user.email, name: user.name.replace(/[\u0000-\u001f\u007f]+/g, " ").trim() }],
    subject: "Restablece tu contraseña del panel de MR Design",
    htmlContent: [
      `<p>Hola, ${name}:</p>`,
      "<p>Pediste restablecer tu contraseña del panel de MR Design. Elige una nueva desde este enlace:</p>",
      `<p><a href="${escapeHtml(link)}">Restablecer la contraseña</a></p>`,
      `<p>El enlace vence en ${RESET_TOKEN_SECONDS / 3600} hora y sirve una sola vez. Si no lo pediste, ignora este email: tu contraseña no cambia.</p>`,
    ].join("\n"),
  });
}

// Sends without waiting. The form must answer as fast for an existing account (which gets an
// email) as for an unknown one, or the response time would reveal which emails have accounts.
// sendPasswordResetEmail never throws; the catch only covers an unexpected failure.
export function queuePasswordResetEmail(user: { email: string; name: string }, token: string): void {
  void sendPasswordResetEmail(user, token).catch((error: unknown) => console.error("password reset email failed", error));
}
