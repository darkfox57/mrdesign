"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { LANDINGS_ADMIN_PATH, parseLandingId, parseNewLanding, translationStart } from "@/lib/admin/landing-create";
import { requirePermission } from "@/lib/auth/require-permission";
import { violatesUnique } from "@/lib/blog/unique-violation";
import { db } from "@/lib/db";
import { LANDING_SLUG_TAKEN as SLUG_TAKEN, changePublication } from "@/lib/landings/editor";
import { PUBLIC_LANDING_ROUTE } from "@/lib/landings/routes";

const TRANSLATION_TAKEN = "Esa landing ya tiene versión en ese idioma.";

const publicationSchema = z.object({
  landingId: z.string().refine((value) => parseLandingId(value) !== null),
  intent: z.enum(["publish", "unpublish"]),
});

export type LandingPublicationState = { error?: string };

// Admins and editors publish landings (`content: publish`). The public page renders on every
// request; the route is revalidated anyway so no cached copy outlives an unpublish.
export async function setLandingPublication(_: LandingPublicationState, formData: FormData): Promise<LandingPublicationState> {
  await requirePermission("content", ["publish"]);
  const parsed = publicationSchema.safeParse({ landingId: formData.get("landingId"), intent: formData.get("intent") });
  if (!parsed.success) return { error: "Acción no válida." };

  // Same rule as posts: a first publish stamps today's date, later ones keep it.
  const outcome = await changePublication(parsed.data.landingId, parsed.data.intent);
  if (outcome.error) return outcome;
  revalidatePath(LANDINGS_ADMIN_PATH, "layout");
  revalidatePath(PUBLIC_LANDING_ROUTE, "page");
  return {};
}

export type CreateLandingState = { errors?: string[]; values?: Record<string, string> };

// Creates a landing as a draft with no page yet and opens it in the visual editor. With
// `translationOf`, it is a version of that landing in another language: same translationKey
// (language switcher and hreflang), starting from a copy of its blocks.
export async function createLanding(_: CreateLandingState, formData: FormData): Promise<CreateLandingState> {
  await requirePermission("content", ["write"]);
  const values = Object.fromEntries(
    ["locale", "title", "slug", "translationOf"].map((name) => {
      const value = formData.get(name);
      return [name, typeof value === "string" ? value : ""];
    }),
  );

  const parsed = parseNewLanding(values);
  if (!parsed.success) return { errors: parsed.errors, values };
  const { locale, title, slug } = parsed.data;

  let translation: { translationKey: string; draftBlocks: Prisma.InputJsonValue } | null = null;
  if (values.translationOf) {
    const sourceId = parseLandingId(values.translationOf);
    if (!sourceId) return { errors: ["La landing original ya no existe."], values };
    const source = await db.landing.findUnique({
      where: { id: sourceId },
      select: { locale: true, translationKey: true, blocks: true, draftBlocks: true },
    });
    if (!source) return { errors: ["La landing original ya no existe."], values };
    if (source.locale === locale) return { errors: ["La traducción tiene que estar en otro idioma."], values };
    const sibling = await db.landing.findUnique({
      where: { translationKey_locale: { translationKey: source.translationKey, locale } },
      select: { id: true },
    });
    if (sibling) return { errors: [TRANSLATION_TAKEN], values };
    translation = { translationKey: source.translationKey, draftBlocks: translationStart(source) as unknown as Prisma.InputJsonValue };
  }

  const taken = await db.landing.findUnique({ where: { locale_slug: { locale, slug } }, select: { id: true } });
  if (taken) return { errors: [SLUG_TAKEN], values };

  let id: string;
  try {
    const created = await db.landing.create({
      data: {
        locale,
        title,
        slug,
        status: "DRAFT",
        ...(translation ? { translationKey: translation.translationKey, draftBlocks: translation.draftBlocks } : {}),
      },
      select: { id: true },
    });
    id = created.id;
  } catch (error) {
    // Another save took the slug, or the translation slot, between the check and the write.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: [violatesUnique(error, "Landing", ["translationKey", "locale"]) ? TRANSLATION_TAKEN : SLUG_TAKEN], values };
    }
    throw error;
  }
  revalidatePath(LANDINGS_ADMIN_PATH, "layout");
  redirect(`${LANDINGS_ADMIN_PATH}/${id}/visual`);
}
