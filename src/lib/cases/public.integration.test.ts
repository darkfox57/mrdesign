// @vitest-environment node
// Public case queries against the local database: only published cases the client authorized, in
// the requested language, ever leave the dashboard.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../db";
import { isLocalDatabase } from "../is-local-database";
import {
  findPublicCaseTranslation,
  getPublicCase,
  listPublicCases,
  publicCaseTranslations,
  relatedPublicCases,
  sitemapPublicCases,
} from "./public";

// A random tail: another file starting in the same millisecond must not share these rows.
const run = `pubcase-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const day = 24 * 60 * 60 * 1000;

// These tests create and delete rows: they only run against a local database (docker compose).
const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase
  ? "public case queries"
  : "public case queries (skipped: DATABASE_URL is not the local docker database, see .env.example)";

const slug = (name: string) => `${run}-${name}`;
const ours = <T extends { slug: string }>(rows: T[]) => rows.filter((row) => row.slug.startsWith(run)).map((row) => row.slug);

describe.skipIf(!runAgainstDatabase)(title, () => {
  const pairKey = `${run}-pair`;
  const draftPairKey = `${run}-draft-pair`;

  beforeAll(async () => {
    const text = { summary: "Resumen.", challenge: "Reto.", solution: "Solución.", result: "Resultado." };
    const published = (daysAgo: number) => ({ status: "PUBLISHED" as const, publishedAt: new Date(Date.now() - daysAgo * day), clientAuthorized: true });
    const row = (name: string, locale: "es" | "en", extra: Record<string, unknown> = {}) => ({
      ...text,
      locale,
      slug: slug(name),
      title: `Caso ${name}`,
      client: `Cliente ${name}`,
      ...extra,
    });

    await db.case.createMany({
      data: [
        // A published pair, linked by translationKey.
        row("par", "es", { ...published(1), translationKey: pairKey, lines: ["shopify"], metrics: [{ label: "Pedidos", value: "+30 %", source: "Informe" }] }),
        row("pair", "en", { ...published(1), translationKey: pairKey, lines: ["shopify"] }),
        // Order: featured first, then the lower position, then the newest publication.
        row("destacado", "es", { ...published(9), featured: true, sortOrder: 5, lines: ["shopify", "plugins"] }),
        row("posicion-1", "es", { ...published(0.5), sortOrder: 1, lines: ["websites"] }),
        row("viejo", "es", { ...published(4), lines: ["plugins"] }),
        // Published in Spanish, its English version is still a draft.
        row("solo-es", "es", { ...published(2), translationKey: draftPairKey, lines: ["wordpress"] }),
        row("only-es", "en", { translationKey: draftPairKey, clientAuthorized: true, lines: ["wordpress"] }),
        // Never public: a draft, a published row without the client's authorization (only a direct
        // write can leave one), and an archived case that once was published.
        row("borrador", "es", { clientAuthorized: true, lines: ["shopify"] }),
        row("sin-autorizacion", "es", { status: "PUBLISHED", publishedAt: new Date(Date.now() - day), clientAuthorized: false, lines: ["shopify"] }),
        row("archivado", "es", { status: "ARCHIVED", publishedAt: new Date(Date.now() - day), clientAuthorized: true, lines: ["shopify"] }),
      ],
    });
  });

  afterAll(async () => {
    await db.case.deleteMany({ where: { slug: { startsWith: run } } });
  });

  describe("getPublicCase", () => {
    it("returns a published, authorized case in its own language, with its metrics", async () => {
      const item = await getPublicCase("es", slug("par"));
      expect(item).toMatchObject({ title: "Caso par", locale: "es", lines: ["shopify"], metrics: [{ label: "Pedidos", value: "+30 %", source: "Informe" }], gallery: [] });
    });

    it("never returns drafts, unauthorized, archived or other-language rows", async () => {
      for (const name of ["borrador", "sin-autorizacion", "archivado", "only-es"]) {
        expect(await getPublicCase(name === "only-es" ? "en" : "es", slug(name)), name).toBeNull();
      }
      expect(await getPublicCase("en", slug("par"))).toBeNull();
    });
  });

  describe("listPublicCases", () => {
    it("lists the language's public cases: featured, then by position, then newest first", async () => {
      expect(ours(await listPublicCases("es"))).toEqual([slug("destacado"), slug("par"), slug("solo-es"), slug("viejo"), slug("posicion-1")]);
    });

    it("lists only the other language's public versions in English", async () => {
      expect(ours(await listPublicCases("en"))).toEqual([slug("pair")]);
    });
  });

  describe("relatedPublicCases", () => {
    it("returns public cases sharing a line, without the case itself, at most the limit", async () => {
      const item = (await getPublicCase("es", slug("destacado")))!;
      const related = await relatedPublicCases(item, 3);
      expect(related.length).toBeLessThanOrEqual(3);
      expect(related.map((row) => row.slug)).not.toContain(item.slug);
      expect(ours(related)).toEqual(expect.arrayContaining([slug("par")]));
      // Drafts, unauthorized and archived cases share the line too, and stay out.
      expect(ours(related).every((name) => [slug("par"), slug("viejo")].includes(name))).toBe(true);
      expect(related.every((row) => row.lines.some((line) => item.lines.includes(line)))).toBe(true);
    });

    it("returns nothing for a case without lines, and respects the limit", async () => {
      const item = (await getPublicCase("es", slug("par")))!;
      expect(await relatedPublicCases({ ...item, lines: [] }, 3)).toEqual([]);
      expect(await relatedPublicCases(item, 1)).toHaveLength(1);
    });
  });

  describe("translations", () => {
    it("lists the slug of every public language version", async () => {
      expect(await publicCaseTranslations(pairKey)).toEqual({ es: slug("par"), en: slug("pair") });
      expect(await publicCaseTranslations(draftPairKey)).toEqual({ es: slug("solo-es") });
    });

    it("finds the translation of a slug opened in the other language", async () => {
      expect(await findPublicCaseTranslation(slug("par"), "en")).toEqual({ slug: slug("pair") });
      expect(await findPublicCaseTranslation(slug("solo-es"), "en")).toEqual({ slug: null });
      expect(await findPublicCaseTranslation(slug("borrador"), "en")).toBeNull();
    });
  });

  describe("sitemapPublicCases", () => {
    it("lists every public version and nothing else", async () => {
      const rows = (await sitemapPublicCases()).filter((row) => row.slug.startsWith(run));
      expect(rows.map((row) => row.slug).sort()).toEqual(
        [slug("par"), slug("pair"), slug("destacado"), slug("posicion-1"), slug("viejo"), slug("solo-es")].sort(),
      );
      expect(rows.find((row) => row.slug === slug("pair"))).toMatchObject({ locale: "en", translationKey: pairKey });
      expect(rows.every((row) => row.updatedAt instanceof Date)).toBe(true);
    });
  });
});
