"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { loginRateLimiter } from "@/lib/auth/login-rate-limit";
import { clientIp } from "@/lib/client-ip";
import { ADMIN_LOGIN_PATH } from "@/lib/auth/session";

export type SignInState = { error?: string; email?: string };

const credentials = z.object({
  email: z.email("Escribe un email válido.").transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Escribe tu contraseña."),
});

const UNAVAILABLE = "No pudimos verificar el ingreso. Prueba de nuevo en unos minutos.";

const isCredentialRejection = (error: unknown) => error instanceof APIError && error.statusCode < 500;

// Only same-site admin paths are allowed as the post-login destination (no open redirects).
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && next !== ADMIN_LOGIN_PATH ? next : "/admin";
}

export async function signIn(_: SignInState, formData: FormData): Promise<SignInState> {
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";
  const parsed = credentials.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email };

  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  // better-auth's rate limit does not cover auth.api calls made from server actions.
  // The attempt is counted before the password is checked, so parallel guesses cannot slip past the
  // limit, and a locked account is never checked. If it cannot be counted, it is refused (fail closed).
  const countedAt = Date.now();
  const limit = await loginRateLimiter.consume(ip, parsed.data.email, countedAt);
  if (!limit.allowed) {
    if (limit.unavailable) return { error: UNAVAILABLE, email };
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return { error: `Demasiados intentos. Prueba de nuevo en ${minutes} min.`, email };
  }

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: requestHeaders });
  } catch (error) {
    unstable_rethrow(error);
    // Same message for unknown email, wrong password or banned user: do not reveal which. These are
    // better-auth's 4xx APIErrors (INVALID_EMAIL_OR_PASSWORD, BANNED_USER and request errors), and
    // the attempt stays counted: refunding a banned user's correct password would reveal it.
    if (isCredentialRejection(error)) return { error: "Email o contraseña incorrectos.", email };
    // Anything else (database, adapter, better-auth 5xx) judged no password: the attempt is given
    // back, so outages cannot lock out an admin with valid credentials.
    console.error("login check failed", error);
    await loginRateLimiter
      .refund(ip, parsed.data.email, countedAt)
      .catch((cause: unknown) => console.error("login throttle refund failed", cause));
    return { error: UNAVAILABLE, email };
  }

  // The user is signed in: a failed counter write must not block the redirect.
  await loginRateLimiter
    .recordSuccess(ip, parsed.data.email, countedAt)
    .catch((cause: unknown) => console.error("login throttle success write failed", cause));
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect(ADMIN_LOGIN_PATH);
}
