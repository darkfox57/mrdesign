import type { Data } from "@puckeditor/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import { editorStartData, hasLandingDraft, parseLandingId } from "@/lib/admin/landing-create";
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
  const id = parseLandingId((await params).id);
  if (!id) notFound();
  const landing = await db.landing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      locale: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      blocks: true,
      draftBlocks: true,
      updatedAt: true,
    },
  });
  if (!landing) notFound();
  // Stored blocks are validated again before Puck gets them; the notice explains a fallback.
  const start = editorStartData(landing);

  return (
    <EditorLoader
      landingId={landing.id}
      title={landing.title}
      locale={landing.locale}
      publicPath={getPathname({ locale: landing.locale, href: landingHref(landing.slug) })}
      initialData={start.data as unknown as Data}
      notice={start.notice}
      // The version every save, publish and discard is checked against (src/lib/landings/editor.ts).
      version={landing.updatedAt.toISOString()}
      published={landing.status === "PUBLISHED"}
      hasDraft={hasLandingDraft(landing)}
    />
  );
}
