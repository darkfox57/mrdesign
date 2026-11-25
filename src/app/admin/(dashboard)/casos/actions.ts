"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { caseFormInputFromFormData, caseIdsSchema, casePublicationSchema, type CaseFieldErrors, type CaseFormInput } from "@/lib/admin/case-form";
import { CASES_ADMIN_PATH, saveCase, setCasePublication } from "@/lib/admin/cases";
import { requirePermission } from "@/lib/auth/require-permission";
import { publicCasePaths } from "@/lib/cases/paths";
import { coverPrefixes } from "@/lib/media/cover-prefixes";

export type SaveCaseState = {
  ok?: string;
  error?: string;
  fieldErrors?: CaseFieldErrors;
  values?: CaseFormInput;
};

export type CasePublicationState = { ok?: string; error?: string };

function revalidateCases() {
  revalidatePath(CASES_ADMIN_PATH, "layout");
  // The home page, the portfolio index and every case page, old slugs included (publicCasePaths).
  for (const { path, type } of publicCasePaths()) revalidatePath(path, type);
}

// Creates a case (as a draft) or updates one; "Guardar y publicar" also publishes it.
// Needs `content: write`, and `content: publish` to publish.
export async function saveCaseAction(_: SaveCaseState, formData: FormData): Promise<SaveCaseState> {
  await requirePermission("content", ["write"]);
  const intent = formData.get("intent") === "publish" ? "publish" : "save";
  if (intent === "publish") await requirePermission("content", ["publish"]);

  const values = caseFormInputFromFormData(formData);
  const ids = caseIdsSchema.safeParse({
    caseId: formData.get("caseId") ?? "",
    translationOf: formData.get("translationOf") ?? "",
    version: formData.get("version") ?? "",
  });
  if (!ids.success) return { error: "Acción no válida.", values };

  const result = await saveCase({ ...ids.data, input: values, intent, libraryPrefixes: coverPrefixes() });
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors, values };

  revalidateCases();
  if (result.created) redirect(`${CASES_ADMIN_PATH}/${result.id}`);
  return { ok: intent === "publish" ? "Publicado." : "Guardado." };
}

// The publish toggle of the list and the editor header. Needs `content: publish`.
export async function setCasePublicationAction(_: CasePublicationState, formData: FormData): Promise<CasePublicationState> {
  await requirePermission("content", ["publish"]);
  const parsed = casePublicationSchema.safeParse({ caseId: formData.get("caseId"), intent: formData.get("intent") });
  if (!parsed.success) return { error: "Acción no válida." };

  const result = await setCasePublication({ ...parsed.data, libraryPrefixes: coverPrefixes() });
  if (!result.ok) return { error: result.error };
  revalidateCases();
  return { ok: result.message };
}
