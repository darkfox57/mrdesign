"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { LANDINGS_ADMIN_PATH } from "@/lib/admin/landing-create";
import { publicationChange } from "@/lib/admin/posts";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PUBLIC_LANDING_ROUTE } from "@/lib/landings/routes";
import { coverPrefixes } from "@/lib/media/cover-prefixes";
import { imageHostErrors } from "@/lib/visual-builder/images";
import { parsePageFields, type LandingPageColumns } from "@/lib/visual-builder/page-fields";
import { validateBuilderData, type BuilderPage } from "@/lib/visual-builder/validate";

export type BuilderActionState = { ok?: string; errors?: string[] };

const SLUG_TAKEN = "Slug: otra landing de este idioma ya lo usa.";
const GONE = "La landing ya no existe. Recarga la página.";

const landingIdSchema = z.string().min(1).max(100);

type Checked = { errors: string[] } | { id: string; page: BuilderPage; columns: LandingPageColumns; publishedAt: Date | null };

// What the browser sends is not trusted: the id, the blocks, their images and the page fields are
// checked here, and the slug must stay unique per language.
async function checkPage(landingId: unknown, data: unknown): Promise<Checked> {
  const id = landingIdSchema.safeParse(landingId);
  if (!id.success) return { errors: [GONE] };
  const landing = await db.landing.findUnique({ where: { id: id.data }, select: { locale: true, publishedAt: true } });
  if (!landing) return { errors: [GONE] };

  const page = validateBuilderData(data);
  if (!page.success) return { errors: page.errors };
  const fields = parsePageFields(page.data.root.props);
  const errors = [...imageHostErrors(page.data, coverPrefixes()), ...(fields.success ? [] : fields.errors)];
  if (!fields.success || errors.length > 0) return { errors };

  const taken = await db.landing.findFirst({
    where: { locale: landing.locale, slug: fields.data.slug, NOT: { id: id.data } },
    select: { id: true },
  });
  if (taken) return { errors: [SLUG_TAKEN] };
  return { id: id.data, page: page.data, columns: fields.data, publishedAt: landing.publishedAt };
}

async function updateLanding(landingId: string, data: Prisma.LandingUpdateInput): Promise<BuilderActionState | null> {
  try {
    await db.landing.update({ where: { id: landingId }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { errors: [SLUG_TAKEN] };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { errors: [GONE] };
    throw error;
  }
  revalidatePath(LANDINGS_ADMIN_PATH, "layout");
  return null;
}

// Saves the draft only: nothing the public page uses changes. The page fields (title, slug, SEO)
// travel inside the draft (its root props) and reach the landing's columns only on publish, so a
// draft never moves a published landing's URL or changes its title before it is published.
// Admins and editors both edit landings (`content: write`).
export async function saveLandingDraft(landingId: string, data: unknown): Promise<BuilderActionState> {
  await requireSession();
  const checked = await checkPage(landingId, data);
  if ("errors" in checked) return checked;
  const failed = await updateLanding(checked.id, { draftBlocks: checked.page as Prisma.InputJsonValue });
  return failed ?? { ok: "Borrador guardado." };
}

// Publishes what the editor has now: it becomes the page's blocks and the draft is cleared.
export async function publishLanding(landingId: string, data: unknown): Promise<BuilderActionState> {
  await requireSession();
  const checked = await checkPage(landingId, data);
  if ("errors" in checked) return checked;
  const failed = await updateLanding(checked.id, {
    ...checked.columns,
    blocks: checked.page as Prisma.InputJsonValue,
    draftBlocks: Prisma.DbNull,
    // Same rule as posts: a first publish stamps today's date, later ones keep it.
    ...publicationChange("publish", checked.publishedAt),
  });
  if (failed) return failed;
  // The public page is force-dynamic; revalidating keeps any cached copy (old slug included) from outliving the publish.
  revalidatePath(PUBLIC_LANDING_ROUTE, "page");
  return { ok: "Landing publicada." };
}

export async function discardLandingDraft(landingId: string): Promise<BuilderActionState> {
  await requireSession();
  const id = landingIdSchema.safeParse(landingId);
  if (!id.success) return { errors: [GONE] };
  const failed = await updateLanding(id.data, { draftBlocks: Prisma.DbNull });
  return failed ?? { ok: "Borrador descartado." };
}
