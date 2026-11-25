import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseToFormInput } from "@/lib/admin/case-form";
import { CASES_ADMIN_PATH, caseName, caseTranslations } from "@/lib/admin/cases";
import { STATUS_LABELS } from "@/lib/admin/posts";
import { requirePermission } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { PublishButton } from "../../blog/PublishButton";
import { TranslationsList } from "../../blog/TranslationsPanel";
import { setCasePublicationAction } from "../actions";
import { CaseForm } from "../CaseForm";

export const metadata: Metadata = { title: "Editar caso" };

export default async function EditCasePage({ params }: PageProps<"/admin/casos/[id]">) {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  await requirePermission("content", ["write"]);
  const { id } = await params;
  const item = await db.case.findUnique({ where: { id } });
  if (!item) notFound();
  const siblings = await caseTranslations(item);
  const published = item.status === "PUBLISHED";

  return (
    <>
      <Link href={CASES_ADMIN_PATH} className="text-sm font-medium text-brand-700 underline underline-offset-2">
        Volver a los casos
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-headline text-ink">Editar caso</h1>
        <div className="flex items-center gap-3">
          <span className={published ? "font-medium text-ink" : "text-graphite"}>{STATUS_LABELS[item.status]}</span>
          {item.status === "ARCHIVED" ? null : (
            <PublishButton postId={item.id} idField="caseId" title={caseName(item)} published={published} action={setCasePublicationAction} />
          )}
        </div>
      </div>
      <div className="mt-4">
        <TranslationsList item={item} siblings={siblings} basePath={CASES_ADMIN_PATH} />
      </div>
      <div className="mt-6">
        <CaseForm caseId={item.id} version={item.updatedAt.toISOString()} published={published} initial={caseToFormInput(item)} />
      </div>
    </>
  );
}
