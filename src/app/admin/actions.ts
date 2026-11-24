"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
  // The counters live in the database; if it cannot answer, the attempt is refused (fail closed).
  const limit = await loginRateLimiter.check(ip, parsed.data.email);
  if (!limit.allowed) {
    if (limit.unavailable) return { error: "No pudimos verificar el ingreso. Prueba de nuevo en unos minutos.", email };
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return { error: `Demasiados intentos. Prueba de nuevo en ${minutes} min.`, email };
  }

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: requestHeaders });
  } catch (error) {
    if (error instanceof APIError) {
      // The attempt already failed: a counter write error is logged, never shown, so the answer
      // stays the same as for any wrong password.
      await loginRateLimiter.recordFailure(ip, parsed.data.email).catch((cause: unknown) => console.error("login throttle write failed", cause));
      // Same message for unknown email, wrong password or banned user: do not reveal which.
      return { error: "Email o contraseña incorrectos.", email };
    }
    throw error;
  }

  // The user is signed in: a failed reset of the counter must not block the redirect.
  await loginRateLimiter.clear(ip, parsed.data.email).catch((cause: unknown) => console.error("login throttle clear failed", cause));
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect(ADMIN_LOGIN_PATH);
}
