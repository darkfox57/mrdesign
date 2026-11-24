"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin/users";
import { auth } from "@/lib/auth";
import { passwordResetRateLimiter } from "@/lib/auth/login-rate-limit";
import { clientIp } from "@/lib/client-ip";

export type RequestResetState = { sent?: boolean; error?: string; email?: string };

// Always the same answer, registered or not: the form must not reveal which emails have accounts.
export async function requestPasswordReset(_: RequestResetState, formData: FormData): Promise<RequestResetState> {
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")).trim().toLowerCase() : "";
  const parsed = z.email().safeParse(email);
  if (!parsed.success) return { error: "Escribe un email válido.", email };

  const ip = clientIp(await headers());
  // The request is counted first and only sent if it is still within the limit after its own count,
  // so parallel requests cannot all pass. Fails closed without changing the answer: if it cannot be
  // counted (logged by the limiter), no email is sent and the visitor gets the uniform answer below.
  const limit = await passwordResetRateLimiter.consume(ip, parsed.data);
  if (!limit.allowed) {
    if (limit.unavailable) return { sent: true };
    return { error: `Demasiados pedidos. Prueba de nuevo en ${Math.ceil(limit.retryAfterSeconds / 60)} min.`, email };
  }

  // better-auth creates the token and calls sendResetPassword (src/lib/auth/index.ts) only for
  // existing accounts, so a failure there would happen only for them. A distinct answer would reveal
  // which accounts exist: failures are logged on the server and the visitor gets the same answer.
  try {
    await auth.api.requestPasswordReset({ body: { email: parsed.data } });
  } catch (error) {
    console.error("password reset request failed", error);
  }
  return { sent: true };
}

export type ResetPasswordState = { done?: boolean; error?: string };

const resetSchema = z
  .object({
    token: z.string().min(1, "El enlace no es válido o ya venció. Pide uno nuevo."),
    password: z.string().min(MIN_PASSWORD_LENGTH, `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`).max(128),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, { message: "Las contraseñas no coinciden.", path: ["confirm"] });

export async function resetPassword(_: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = resetSchema.safeParse({ token: formData.get("token"), password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  try {
    // Also ends every open session of the account (revokeSessionsOnPasswordReset).
    await auth.api.resetPassword({ body: { token: parsed.data.token, newPassword: parsed.data.password } });
  } catch (error) {
    if (error instanceof APIError) return { error: "El enlace no es válido o ya venció. Pide uno nuevo." };
    throw error;
  }
  return { done: true };
}
