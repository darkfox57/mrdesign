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
import { coverPrefixes } from "@/lib/media/cover-prefixes";
import { MediaMissingError, withLibraryImages } from "@/lib/media/references";
import { collectImageUrls } from "@/lib/visual-builder/images";

const TRANSLATION_TAKEN = "Esa landing ya tiene versión en ese idioma.";
const copiedImageMissing = (url: string) =>
  `Imagen ${url}: la landing original la usa, pero no está en la biblioteca (puede que la hayan borrado). Quítala de la original o elige otra.`;

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

  let translation: { translationKey: string; draftBlocks: Prisma.InputJsonValue; imageUrls: string[] } | null = null;
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
    const start = translationStart(source);
    translation = {
      translationKey: source.translationKey,
      draftBlocks: start as unknown as Prisma.InputJsonValue,
      imageUrls: collectImageUrls(start.content),
    };
  }

  const taken = await db.landing.findUnique({ where: { locale_slug: { locale, slug } }, select: { id: true } });
  if (taken) return { errors: [SLUG_TAKEN], values };

  let id: string;
  try {
    // The copied blocks' library images are locked with the insert, so one deleted meanwhile
    // refuses the copy instead of leaving the new landing pointing at it (src/lib/media/references.ts).
    const created = await withLibraryImages(translation?.imageUrls ?? [], coverPrefixes(), (tx) =>
      tx.landing.create({
        data: {
          locale,
          title,
          slug,
          status: "DRAFT",
          ...(translation ? { translationKey: translation.translationKey, draftBlocks: translation.draftBlocks } : {}),
        },
        select: { id: true },
      }),
    );
    id = created.id;
  } catch (error) {
    if (error instanceof MediaMissingError) return { errors: error.urls.map(copiedImageMissing), values };
    // Another save took the translation slot, or the slug, between the check and the write. Any
    // other unique index of the landing is reported as the slug too.
    if (violatesUnique(error, "Landing", ["translationKey", "locale"])) return { errors: [TRANSLATION_TAKEN], values };
    if (violatesUnique(error, "Landing")) return { errors: [SLUG_TAKEN], values };
    throw error;
  }
  revalidatePath(LANDINGS_ADMIN_PATH, "layout");
  redirect(`${LANDINGS_ADMIN_PATH}/${id}/visual`);
}
