"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/auth/session";
import { z } from "zod";
import { MIN_PASSWORD_LENGTH, canChangeAccount, newUserSchema, roleChangeSchema, userIdSchema } from "@/lib/admin/users";

const USERS_PATH = "/admin/usuarios";

export type NewUserFields = { name?: string; email?: string; role?: string };
export type NewUserState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "role", string>>;
  values?: NewUserFields;
};
export type AccountActionState = { ok?: string; error?: string };

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const isApiError = (error: unknown, code: string) =>
  error instanceof APIError && (error.body as { code?: string } | undefined)?.code === code;

// better-auth rejects a stale or crafted user id, or a caller who lost the admin role a moment
// ago. Show a message instead of the generic error page; anything else is a real failure.
const FAILED_ACCOUNT_ACTION = "No se pudo aplicar el cambio. Recarga la página y prueba de nuevo.";

export async function createUser(_: NewUserState, formData: FormData): Promise<NewUserState> {
  await requireSession(["admin"]);
  // The password is never sent back to the browser.
  const values = { name: text(formData, "name"), email: text(formData, "email"), role: text(formData, "role") };
  const parsed = newUserSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages?.[0]]));
    return { fieldErrors, values };
  }

  try {
    // The admin plugin checks again that the caller may create users.
    await auth.api.createUser({ body: parsed.data, headers: await headers() });
  } catch (error) {
    if (isApiError(error, "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")) {
      return { error: "Ya existe un usuario con ese email.", values };
    }
    if (error instanceof APIError) return { error: "No se pudo crear el usuario.", values };
    throw error;
  }

  revalidatePath(USERS_PATH);
  return { ok: true };
}

export async function changeRole(_: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const { user } = await requireSession(["admin"]);
  const parsed = roleChangeSchema.safeParse({ userId: text(formData, "userId"), role: text(formData, "role") });
  if (!parsed.success) return { error: "Elige un rol válido." };
  if (!canChangeAccount(user.id, parsed.data.userId)) return { error: "No puedes cambiar tu propio rol." };

  try {
    await auth.api.setRole({ body: parsed.data, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) return { error: FAILED_ACCOUNT_ACTION };
    throw error;
  }
  revalidatePath(USERS_PATH);
  return { ok: "Rol actualizado." };
}

export async function setBlocked(_: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const { user } = await requireSession(["admin"]);
  const parsed = userIdSchema.safeParse({ userId: text(formData, "userId") });
  if (!parsed.success) return { error: "Usuario no válido." };
  if (!canChangeAccount(user.id, parsed.data.userId)) return { error: "No puedes bloquear tu propia cuenta." };

  // The field carries the requested state (block or unblock), not a toggle, so a repeated submit
  // cannot flip the account back.
  const block = text(formData, "blocked") === "true";
  const requestHeaders = await headers();
  try {
    // Blocking also ends every open session of that user.
    if (block) await auth.api.banUser({ body: { userId: parsed.data.userId }, headers: requestHeaders });
    else await auth.api.unbanUser({ body: { userId: parsed.data.userId }, headers: requestHeaders });
  } catch (error) {
    if (error instanceof APIError) return { error: FAILED_ACCOUNT_ACTION };
    throw error;
  }
  revalidatePath(USERS_PATH);
  return { ok: block ? "Usuario bloqueado." : "Usuario desbloqueado." };
}

const passwordSchema = z.object({
  userId: z.string().min(1),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    .max(128, "La contraseña es demasiado larga."),
});

// For when the reset email does not arrive. Admins only, never their own account (they use the
// reset link); the user's open sessions end so the old password stops working everywhere.
export async function setPassword(_: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const { user } = await requireSession(["admin"]);
  const parsed = passwordSchema.safeParse({ userId: text(formData, "userId"), password: text(formData, "password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Contraseña no válida." };
  if (!canChangeAccount(user.id, parsed.data.userId)) return { error: "Cambia tu propia contraseña con el enlace de recuperación." };

  const requestHeaders = await headers();
  try {
    await auth.api.setUserPassword({ body: { userId: parsed.data.userId, newPassword: parsed.data.password }, headers: requestHeaders });
  } catch (error) {
    if (error instanceof APIError) return { error: FAILED_ACCOUNT_ACTION };
    throw error;
  }
  try {
    await auth.api.revokeUserSessions({ body: { userId: parsed.data.userId }, headers: requestHeaders });
  } catch (error) {
    // The password did change: say so, and that the open sessions may still be alive.
    if (error instanceof APIError) return { error: "La contraseña cambió, pero no se pudieron cerrar sus sesiones abiertas. Bloquea la cuenta si hace falta." };
    throw error;
  }
  return { ok: "Contraseña cambiada." };
}
