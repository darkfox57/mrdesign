import { z } from "zod";
import { ROLES, type Role } from "@/lib/auth/permissions";

export const MIN_PASSWORD_LENGTH = 12;

export const ROLE_LABELS: Record<Role, string> = { admin: "Administrador", editor: "Editor" };

const role = z.enum(ROLES, "Elige un rol válido.");

export const newUserSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre.").max(100, "El nombre es demasiado largo."),
  email: z.email("Escribe un email válido.").transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    .max(128, "La contraseña es demasiado larga."),
  role,
});

export const roleChangeSchema = z.object({ userId: z.string().min(1), role });

export const userIdSchema = z.object({ userId: z.string().min(1) });

// An admin cannot change the role of, or block, their own account: one mistake would lock
// the only admin out of the dashboard.
export function canChangeAccount(actorId: string, targetId: string) {
  return actorId !== targetId;
}
