import type { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/routing";
import { db } from "../db";
import { caseGallery, caseLines, caseMetrics } from "./view";

// The one visibility rule of the public case pages: published, with a publication date already
// reached, and authorized by the client. Publishing already requires the authorization; checking it
// here too keeps a case private even if a direct write leaves it published without one.
// Drafts and archived cases never leave the dashboard.
function visible(locale?: Locale): Prisma.CaseWhereInput {
  return { status: "PUBLISHED", clientAuthorized: true, publishedAt: { lte: new Date() }, ...(locale ? { locale } : {}) };
}

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  client: true,
  lines: true,
  summary: true,
  coverImageUrl: true,
  coverImageAlt: true,
} satisfies Prisma.CaseSelect;

const ORDER: Prisma.CaseOrderByWithRelationInput[] = [{ featured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }, { id: "asc" }];

export type PublicCaseCard = Omit<Prisma.CaseGetPayload<{ select: typeof cardSelect }>, "lines"> & { lines: ReturnType<typeof caseLines> };

const toCard = <T extends { lines: string[] }>(row: T) => ({ ...row, lines: caseLines(row.lines) });

// The portfolio index: featured cases first, then by position (lower first), then newest.
export async function listPublicCases(locale: Locale): Promise<PublicCaseCard[]> {
  const rows = await db.case.findMany({ where: visible(locale), select: cardSelect, orderBy: ORDER });
  return rows.map(toCard);
}

export async function getPublicCase(locale: Locale, slug: string) {
  const row = await db.case.findFirst({
    where: { ...visible(locale), slug },
    select: {
      ...cardSelect,
      locale: true,
      translationKey: true,
      year: true,
      challenge: true,
      solution: true,
      result: true,
      metrics: true,
      stack: true,
      websiteUrl: true,
      gallery: true,
      seoTitle: true,
      seoDescription: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
  if (!row) return null;
  return { ...row, lines: caseLines(row.lines), metrics: caseMetrics(row.metrics), gallery: caseGallery(row.gallery) };
}

export type PublicCase = NonNullable<Awaited<ReturnType<typeof getPublicCase>>>;

// Other public cases of the same language that share a line with this one.
export async function relatedPublicCases(item: { id: string; locale: Locale; lines: readonly string[] }, limit: number): Promise<PublicCaseCard[]> {
  if (item.lines.length === 0) return [];
  const rows = await db.case.findMany({
    where: { ...visible(item.locale), id: { not: item.id }, lines: { hasSome: [...item.lines] } },
    select: cardSelect,
    orderBy: ORDER,
    take: limit,
  });
  return rows.map(toCard);
}

// Slug of every public language version of a case, for hreflang links.
export async function publicCaseTranslations(translationKey: string): Promise<Partial<Record<Locale, string>>> {
  const rows = await db.case.findMany({ where: { ...visible(), translationKey }, select: { locale: true, slug: true } });
  return Object.fromEntries(rows.map((row) => [row.locale, row.slug]));
}

// A slug opened in the wrong locale (the language switcher keeps the slug): null when no public
// case has it, otherwise its translation's slug, or null inside the result when there is none.
export async function findPublicCaseTranslation(slug: string, locale: Locale): Promise<{ slug: string | null } | null> {
  const sources = await db.case.findMany({ where: { ...visible(), slug }, select: { translationKey: true } });
  if (sources.length === 0) return null;
  const translation = await db.case.findFirst({
    where: { ...visible(locale), translationKey: { in: sources.map((source) => source.translationKey) } },
    select: { slug: true },
  });
  return { slug: translation?.slug ?? null };
}

// Every public case version, for the sitemap.
export function sitemapPublicCases() {
  return db.case.findMany({ where: visible(), select: { locale: true, slug: true, translationKey: true, updatedAt: true } });
}
