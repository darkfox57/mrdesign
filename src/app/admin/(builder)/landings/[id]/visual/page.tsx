import type { Data } from "@puckeditor/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import { editorStartData } from "@/lib/admin/landing-create";
import { requirePermission } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { landingHref } from "@/lib/landings/routes";
import { EditorLoader } from "./EditorLoader";

export const metadata: Metadata = { title: "Editor visual" };

// Full-screen visual builder: the (builder) route group has no dashboard layout, only the admin
// root layout. Saving keeps a draft in the database; publishing makes it the landing's page.
export default async function VisualBuilderPage({ params }: PageProps<"/admin/landings/[id]/visual">) {
  // The page checks the session itself, as every dashboard page does.
  await requirePermission("content", ["write"]);
  const { id } = await params;
  const landing = await db.landing.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, locale: true, status: true, seoTitle: true, seoDescription: true, blocks: true, draftBlocks: true },
  });
  if (!landing) notFound();

  // A draft exists only while it has not been published (publishing clears it).
  const hasDraft = landing.draftBlocks !== null && JSON.stringify(landing.draftBlocks) !== JSON.stringify(landing.blocks);

  return (
    <EditorLoader
      landingId={landing.id}
      title={landing.title}
      locale={landing.locale}
      publicPath={getPathname({ locale: landing.locale, href: landingHref(landing.slug) })}
      initialData={editorStartData(landing) as unknown as Data}
      published={landing.status === "PUBLISHED"}
      hasDraft={hasDraft}
    />
  );
}
