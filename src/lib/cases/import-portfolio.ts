// Imports the projects of src/content/portfolio.ts as draft success cases (scripts/import-portfolio-cases.ts).
// Each project becomes one draft per language with the client name and nothing else: the texts,
// the cover and the client's authorization are added in the dashboard before anything is published.
import type { PrismaClient } from "@/generated/prisma/client";
import { routing, type Locale } from "@/i18n/routing";
import type { Project, ProjectTag } from "@/content/portfolio";
import { isUniqueViolation } from "@/lib/blog/unique-violation";
import { slugify } from "@/lib/slugify";
import type { CaseLine } from "./lines";

// What each portfolio tag says about the line of work. "web" is a site built for the client.
// "ecommerce" does not say which platform the store runs on (Shopify, PrestaShop, WordPress), so
// it maps to no line: a wrong line would show the case on the wrong public page.
const TAG_LINES: Record<ProjectTag, CaseLine[]> = {
  web: ["websites"],
  ecommerce: [],
};

export function linesFromTags(tags: readonly ProjectTag[]): CaseLine[] {
  return [...new Set(tags.flatMap((tag) => TAG_LINES[tag]))];
}

export function portfolioCaseRows(project: Project) {
  const slug = slugify(project.name);
  return routing.locales.map((locale) => ({
    locale,
    // Both versions of a project share one key, so they are linked as translations.
    translationKey: `portfolio-${project.id}`,
    slug,
    client: project.name,
    title: "",
    summary: "",
    challenge: "",
    solution: "",
    result: "",
    lines: linesFromTags(project.tags),
    stack: [] as string[],
    clientAuthorized: false,
    // The portfolio images live in /public/portfolio, not in the media library a case cover needs.
    coverImageUrl: null,
    status: "DRAFT" as const,
  }));
}

// The script writes to whatever DATABASE_URL names, so it must be given on the command line: it
// never falls back to a .env file. Returns the target (host, port and database, no credentials).
export function requireExplicitDatabaseUrl(env: Record<string, string | undefined>): string {
  const value = env.DATABASE_URL?.trim();
  if (!value) throw new Error("Set DATABASE_URL explicitly on the command line: this script never reads .env.");
  const url = new URL(value);
  return `${url.host}${url.pathname}`;
}

export type ImportOutcome = { locale: Locale; slug: string; client: string; outcome: "created" | "skipped" };

// Idempotent: a project already imported in a language is skipped there, so running it again
// creates nothing. It counts as imported when a row in that language carries the import's key
// (`portfolio-<project id>`, kept when the owner edits the slug) or the project's slug. A missing
// language links to the version that exists.
export async function importPortfolioCases(client: Pick<PrismaClient, "case">, projects: readonly Project[]): Promise<ImportOutcome[]> {
  const outcomes: ImportOutcome[] = [];
  for (const project of projects) {
    const rows = portfolioCaseRows(project);
    const slug = rows[0].slug;
    const importKey = rows[0].translationKey;
    // Already imported in a language: a row with the import's key (the owner may have edited its
    // slug since), or one with the project's slug.
    const existing = await client.case.findMany({
      where: { locale: { in: [...routing.locales] }, OR: [{ translationKey: importKey }, { slug }] },
      select: { locale: true, translationKey: true },
      orderBy: { createdAt: "asc" },
    });
    const translationKey = existing.find((item) => item.translationKey === importKey)?.translationKey ?? existing[0]?.translationKey ?? importKey;

    for (const row of rows) {
      const report = { locale: row.locale, slug, client: project.name };
      if (existing.some((item) => item.locale === row.locale)) {
        outcomes.push({ ...report, outcome: "skipped" });
        continue;
      }
      // Another case may already hold this key in this language: then the draft stays unlinked.
      const slotTaken = await client.case.findUnique({ where: { translationKey_locale: { translationKey, locale: row.locale } }, select: { id: true } });
      try {
        // Without a key the row gets a fresh one (the column default).
        await client.case.create({ data: { ...row, translationKey: slotTaken ? undefined : translationKey } });
        outcomes.push({ ...report, outcome: "created" });
      } catch (error) {
        // A concurrent run created it first.
        if (!isUniqueViolation(error)) throw error;
        outcomes.push({ ...report, outcome: "skipped" });
      }
    }
  }
  return outcomes;
}
