"use server";

import { revalidatePath } from "next/cache";
import { LANDINGS_ADMIN_PATH } from "@/lib/admin/landing-create";
import { requirePermission } from "@/lib/auth/require-permission";
import { discardDraft, publishPage, saveDraft, type EditorWrite } from "@/lib/landings/editor";
import { PUBLIC_LANDING_ROUTE } from "@/lib/landings/routes";
import { coverPrefixes } from "@/lib/media/cover-prefixes";

// `version` is the landing's updatedAt as the editor loaded it (src/lib/landings/editor.ts): a
// write against a newer row is refused with a conflict, and a successful one returns the next
// version for the editor's following save.
export type BuilderActionState = { ok?: string; errors?: string[]; version?: string };

function answer(result: EditorWrite, ok: string): BuilderActionState {
  if (!result.ok) return { errors: result.errors };
  revalidatePath(LANDINGS_ADMIN_PATH, "layout");
  return { ok, version: result.version };
}

// Admins and editors both edit landings (`content: write`).
export async function saveLandingDraft(landingId: string, version: string, data: unknown): Promise<BuilderActionState> {
  await requirePermission("content", ["write"]);
  return answer(await saveDraft(landingId, version, data, coverPrefixes()), "Borrador guardado.");
}

export async function publishLanding(landingId: string, version: string, data: unknown): Promise<BuilderActionState> {
  await requirePermission("content", ["publish"]);
  const result = await publishPage(landingId, version, data, coverPrefixes());
  // The public page is force-dynamic; revalidating keeps any cached copy (old slug included) from outliving the publish.
  if (result.ok) revalidatePath(PUBLIC_LANDING_ROUTE, "page");
  return answer(result, "Landing publicada.");
}

export async function discardLandingDraft(landingId: string, version: string): Promise<BuilderActionState> {
  await requirePermission("content", ["write"]);
  return answer(await discardDraft(landingId, version), "Borrador descartado.");
}
