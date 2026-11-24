"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateApiKey } from "@/lib/api-keys";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const KEYS_PATH = "/admin/api-keys";

export type CreateKeyState = { key?: string; name?: string; error?: string };
export type RevokeKeyState = { error?: string };

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const createSchema = z.object({
  name: z.string().trim().min(1, "Escribe un nombre para reconocerla.").max(80, "Máximo 80 caracteres."),
  publishImmediately: z.boolean(),
});

const revokeSchema = z.object({ keyId: z.string().min(1).max(64) });

// Admins only: a key can publish to the public blog. The plain key is returned once, in this
// response, and is never stored or shown again: only its SHA-256 and prefix reach the database.
export async function createApiKey(_: CreateKeyState, formData: FormData): Promise<CreateKeyState> {
  await requireSession(["admin"]);
  const name = text(formData, "name");
  const parsed = createSchema.safeParse({ name, publishImmediately: formData.get("publishImmediately") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, name };

  const { key, prefix, keyHash } = generateApiKey();
  await db.apiKey.create({ data: { name: parsed.data.name, prefix, keyHash, publishImmediately: parsed.data.publishImmediately } });
  revalidatePath(KEYS_PATH);
  return { key, name: parsed.data.name };
}

export async function revokeApiKey(_: RevokeKeyState, formData: FormData): Promise<RevokeKeyState> {
  await requireSession(["admin"]);
  const parsed = revokeSchema.safeParse({ keyId: text(formData, "keyId") });
  if (!parsed.success) return { error: "Acción no válida." };

  // Only an active key can be revoked; a revoked key stays revoked with its original date. No row
  // changed means the key is missing or was already revoked (another tab or admin): say so. The list
  // is not revalidated then, so the form, and the message with it, stays on screen.
  const { count } = await db.apiKey.updateMany({ where: { id: parsed.data.keyId, revokedAt: null }, data: { revokedAt: new Date() } });
  if (count === 0) return { error: "Esta key ya estaba revocada o no existe." };
  revalidatePath(KEYS_PATH);
  return {};
}
