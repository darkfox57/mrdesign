"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { MediaInUseError, UploadVerificationError, deleteMedia, registerUpload, requestUpload } from "@/lib/media/library";
import { R2NotConfiguredError } from "@/lib/media/r2";
import { altTextSchema, deleteMediaSchema, registerUploadSchema, uploadRequestSchema } from "@/lib/media/rules";

const LIBRARY_PATH = "/admin/imagenes";
const NOT_CONFIGURED = "El almacenamiento de imágenes no está configurado (variables R2_* del servidor).";
// The public pages that show library images (blog, landings) add their revalidation when they ship.

export type UploadTicket =
  | { status: "existing" }
  | { status: "upload"; url: string; headers: Record<string, string> }
  | { status: "error"; error: string };

// Step 1. Admins and editors may upload (permission `media: upload`).
export async function requestMediaUpload(input: unknown): Promise<UploadTicket> {
  await requireSession();
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) return { status: "error", error: parsed.error.issues[0]?.message ?? "Imagen no válida." };

  try {
    const result = await requestUpload(parsed.data);
    return result.status === "existing" ? { status: "existing" } : { status: "upload", url: result.url, headers: result.headers };
  } catch (error) {
    if (error instanceof R2NotConfiguredError) return { status: "error", error: NOT_CONFIGURED };
    throw error;
  }
}

// Step 2, after the browser uploaded the file: verify it in R2 and add it to the library.
export async function registerMediaUpload(input: unknown): Promise<{ ok: true } | { error: string }> {
  const { user } = await requireSession();
  const parsed = registerUploadSchema.extend({ contentType: uploadRequestSchema.shape.contentType }).safeParse(input);
  if (!parsed.success) return { error: "Imagen no válida." };

  try {
    await registerUpload(parsed.data, user.id);
  } catch (error) {
    if (error instanceof UploadVerificationError) return { error: error.message };
    if (error instanceof R2NotConfiguredError) return { error: NOT_CONFIGURED };
    throw error;
  }
  revalidatePath(LIBRARY_PATH);
  return { ok: true };
}

export type MediaActionState = { ok?: string; error?: string };

export async function updateAltText(_: MediaActionState, formData: FormData): Promise<MediaActionState> {
  await requireSession();
  const parsed = altTextSchema.safeParse({ mediaId: formData.get("mediaId"), alt: formData.get("alt") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Texto no válido." };

  const { count } = await db.mediaFile.updateMany({ where: { id: parsed.data.mediaId }, data: { alt: parsed.data.alt } });
  if (count === 0) return { error: "La imagen ya no existe. Recarga la página." };
  revalidatePath(LIBRARY_PATH);
  return { ok: "Guardado." };
}

// Admins only: editors have `media: read, upload` but not `delete`.
export async function removeMedia(_: MediaActionState, formData: FormData): Promise<MediaActionState> {
  await requireSession(["admin"]);
  const parsed = deleteMediaSchema.safeParse({ mediaId: formData.get("mediaId") });
  if (!parsed.success) return { error: "Imagen no válida." };

  try {
    await deleteMedia(parsed.data.mediaId);
  } catch (error) {
    if (error instanceof MediaInUseError) return { error: `No se puede eliminar: está en uso (${error.usedIn.join("; ")}).` };
    if (error instanceof R2NotConfiguredError) return { error: NOT_CONFIGURED };
    throw error;
  }
  revalidatePath(LIBRARY_PATH);
  return { ok: "Eliminada." };
}
