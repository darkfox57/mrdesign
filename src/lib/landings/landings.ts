import type { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/routing";
import { validateBuilderData } from "../visual-builder/validate";
import { db } from "../db";

// Same visibility rule as the blog: published, with a publication date already reached.
function visible(locale?: Locale): Prisma.LandingWhereInput {
  return { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...(locale ? { locale } : {}) };
}

// The published blocks of a landing, validated again on every read like they were on publish, so
// only data that passes validateBuilderData reaches the page. Blocks that fail (an unsafe link, a
// block type the builder no longer has) are logged and the landing is treated as missing.
function readBlocks(row: { id: string; blocks: Prisma.JsonValue | null }) {
  if (row.blocks === null) return null;
  const page = validateBuilderData(row.blocks);
  if (page.success) return page.data;
  console.error(`Landing ${row.id} has stored blocks that fail validation:`, page.errors);
  return null;
}

// A visible landing ready to render, or null.
export async function getLanding(locale: Locale, slug: string) {
  const row = await db.landing.findFirst({ where: { ...visible(locale), slug } });
  if (!row) return null;
  const blocks = readBlocks(row);
  return blocks ? { ...row, blocks } : null;
}

export type PublicLanding = NonNullable<Awaited<ReturnType<typeof getLanding>>>;

// Like the blog: null when no visible landing has this slug, otherwise the slug of its
// translation, or null inside the result when there is none in this locale.
export async function findLandingTranslation(slug: string, locale: Locale): Promise<{ slug: string | null } | null> {
  const sources = await db.landing.findMany({ where: { ...visible(), slug }, select: { translationKey: true } });
  if (sources.length === 0) return null;
  const translation = await db.landing.findFirst({
    where: { ...visible(locale), translationKey: { in: sources.map((source) => source.translationKey) } },
    select: { slug: true },
  });
  return { slug: translation?.slug ?? null };
}

// Slug of every visible language version of a landing, for hreflang links.
export async function landingTranslations(translationKey: string): Promise<Partial<Record<Locale, string>>> {
  const rows = await db.landing.findMany({ where: { ...visible(), translationKey }, select: { locale: true, slug: true } });
  return Object.fromEntries(rows.map((row) => [row.locale, row.slug]));
}

// Every landing the public route renders (visible, with valid blocks), for the sitemap.
export async function sitemapLandings() {
  const rows = await db.landing.findMany({
    where: visible(),
    select: { id: true, locale: true, slug: true, translationKey: true, updatedAt: true, blocks: true },
  });
  return rows.filter((row) => readBlocks(row) !== null).map(({ locale, slug, translationKey, updatedAt }) => ({ locale, slug, translationKey, updatedAt }));
}
