"use server";

import { revalidatePath } from "next/cache";
import { BLOG_ADMIN_PATH, publicBlogPaths, publicationChange, publicationSchema } from "@/lib/admin/posts";
import { requirePermission } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";

export type PublicationState = { ok?: string; error?: string };

// Needs `content: publish` (src/lib/auth/permissions.ts).
export async function setPublication(_: PublicationState, formData: FormData): Promise<PublicationState> {
  await requirePermission("content", ["publish"]);
  const parsed = publicationSchema.safeParse({ postId: formData.get("postId"), intent: formData.get("intent") });
  if (!parsed.success) return { error: "Acción no válida." };

  const post = await db.post.findUnique({ where: { id: parsed.data.postId }, select: { status: true, publishedAt: true } });
  if (!post) return { error: "El post ya no existe. Recarga la página." };
  // The list hides the button for archived posts; a replayed request gets the same answer.
  if (post.status === "ARCHIVED") return { error: "Un post archivado no se publica desde aquí." };

  await db.post.update({
    where: { id: parsed.data.postId },
    data: publicationChange(parsed.data.intent, post.publishedAt),
  });
  revalidatePath(BLOG_ADMIN_PATH, "layout");
  for (const path of publicBlogPaths()) revalidatePath(path, "layout");
  return { ok: parsed.data.intent === "publish" ? "Publicado." : "Pasado a borrador." };
}
