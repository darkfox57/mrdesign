"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin/users";
import { auth } from "@/lib/auth";
import { passwordResetRateLimiter } from "@/lib/auth/login-rate-limit";
import { clientIp } from "@/lib/client-ip";

// `unavailable`: the request could not be processed (the form shows a try-again-later message).
export type RequestResetState = { sent?: boolean; unavailable?: boolean; error?: string; email?: string };

// Always the same answer, registered or not: the form must not reveal which emails have accounts.
export async function requestPasswordReset(_: RequestResetState, formData: FormData): Promise<RequestResetState> {
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")).trim().toLowerCase() : "";
  const parsed = z.email().safeParse(email);
  if (!parsed.success) return { error: "Escribe un email válido.", email };

  const ip = clientIp(await headers());
  const limit = passwordResetRateLimiter.check(ip, parsed.data);
  if (!limit.allowed) {
    return { error: `Demasiados pedidos. Prueba de nuevo en ${Math.ceil(limit.retryAfterSeconds / 60)} min.`, email };
  }
  passwordResetRateLimiter.recordFailure(ip, parsed.data);

  // better-auth creates the token and calls sendResetPassword (src/lib/auth/index.ts). It answers
  // the same for unknown emails and never waits for the email, so a throw here is an infrastructure
  // failure (database, configuration). Say so instead of claiming the link was sent; the answer is
  // the same for every email, so it tells nothing about the account.
  try {
    await auth.api.requestPasswordReset({ body: { email: parsed.data } });
  } catch (error) {
    console.error("password reset request failed", error);
    return { unavailable: true, email };
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
