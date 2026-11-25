// @vitest-environment node
// The portfolio import against the local database: one draft per project and language, linked as
// translations, and a second run creates nothing.
import { afterAll, describe, expect, it } from "vitest";
import type { Project } from "@/content/portfolio";

const { db } = await import("@/lib/db");
const { isLocalDatabase } = await import("@/lib/is-local-database");
const { importPortfolioCases } = await import("./import-portfolio");
const { slugify } = await import("@/lib/slugify");

// Writes rows: runs only against the local Docker database (docs/admin.md rule 7).
const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase ? "portfolio import" : "portfolio import (skipped: DATABASE_URL is not the local docker database)";
const run = `import-${Date.now()}`;

// Fixtures named after the run, so the test never meets the real portfolio rows.
const projects: Project[] = [
  { id: `${run}-a`, name: `Import ${run} Tienda`, image: "/portfolio/a.jpg", imageAlt: { es: "A", en: "A" }, tags: ["web", "ecommerce"] },
  { id: `${run}-b`, name: `Import ${run} Óptica`, image: "/portfolio/b.jpg", imageAlt: { es: "B", en: "B" }, tags: ["web"] },
];
const slugs = projects.map((project) => slugify(project.name));

describe.skipIf(!runAgainstDatabase)(title, () => {
  afterAll(async () => {
    await db.case.deleteMany({ where: { slug: { in: slugs } } });
  });

  it("creates one draft per project and language, and nothing on a second run", async () => {
    const first = await importPortfolioCases(db, projects);
    expect(first.map(({ slug, locale, outcome }) => `${slug}:${locale}:${outcome}`)).toEqual([
      `${slugs[0]}:es:created`,
      `${slugs[0]}:en:created`,
      `${slugs[1]}:es:created`,
      `${slugs[1]}:en:created`,
    ]);
    const rows = await db.case.findMany({ where: { slug: { in: slugs } }, orderBy: [{ slug: "asc" }, { locale: "asc" }] });
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row).toMatchObject({ status: "DRAFT", clientAuthorized: false, title: "", summary: "", coverImageUrl: null, publishedAt: null });
    }
    const [en, es] = rows.filter((row) => row.slug === slugs[0]);
    expect(en.translationKey).toBe(es.translationKey);
    expect(es).toMatchObject({ client: projects[0].name, lines: ["websites"] });

    const before = await db.case.count();
    const second = await importPortfolioCases(db, projects);
    expect(second.every((item) => item.outcome === "skipped")).toBe(true);
    expect(await db.case.count()).toBe(before);
  });

  it("treats a project as imported after the owner edits its slug", async () => {
    await db.case.update({ where: { locale_slug: { locale: "es", slug: slugs[0] } }, data: { slug: `${slugs[0]}-editado` } });
    try {
      const before = await db.case.count();
      const outcomes = await importPortfolioCases(db, projects);
      expect(outcomes.filter((item) => item.outcome === "created")).toEqual([]);
      expect(await db.case.count()).toBe(before);
    } finally {
      await db.case.update({ where: { locale_slug: { locale: "es", slug: `${slugs[0]}-editado` } }, data: { slug: slugs[0] } });
    }
  });

  it("recreates only a missing language, linked to the version that exists", async () => {
    const english = await db.case.findUniqueOrThrow({ where: { locale_slug: { locale: "en", slug: slugs[1] } } });
    const spanish = await db.case.findUniqueOrThrow({ where: { locale_slug: { locale: "es", slug: slugs[1] } } });
    await db.case.delete({ where: { id: english.id } });

    const outcomes = await importPortfolioCases(db, projects);
    expect(outcomes.filter((item) => item.outcome === "created").map(({ slug, locale }) => `${slug}:${locale}`)).toEqual([`${slugs[1]}:en`]);
    const recreated = await db.case.findUniqueOrThrow({ where: { locale_slug: { locale: "en", slug: slugs[1] } } });
    expect(recreated.translationKey).toBe(spanish.translationKey);
  });
});
