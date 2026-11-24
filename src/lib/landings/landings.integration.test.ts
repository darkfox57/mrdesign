// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { isLocalDatabase } from "../is-local-database";
import { findLandingTranslation, getLanding, landingTranslations, sitemapLandings } from "./landings";

const run = `t${Date.now()}`;
const day = 24 * 60 * 60 * 1000;

const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase
  ? "landing queries"
  : "landing queries (skipped: DATABASE_URL is not the local docker database, see .env.example)";

const button = (href: string) => ({ type: "Button", props: { id: "b", label: "Hablemos", href, variant: "primary", align: "left" } });
const blocks = (content: unknown[]): Prisma.InputJsonValue => ({ root: { props: {} }, content }) as Prisma.InputJsonValue;
const valid = blocks([button("/contacto")]);

describe.skipIf(!runAgainstDatabase)(title, () => {
  beforeAll(async () => {
    const published = { status: "PUBLISHED" as const, publishedAt: new Date(Date.now() - day) };
    await db.landing.createMany({
      data: [
        { ...published, locale: "es", translationKey: `${run}-a`, slug: `${run}-tiendas`, title: "Tiendas", blocks: valid },
        { ...published, locale: "en", translationKey: `${run}-a`, slug: `${run}-stores`, title: "Stores", blocks: valid },
        { ...published, locale: "es", translationKey: `${run}-b`, slug: `${run}-solo-es`, title: "Solo", blocks: valid },
        // A draft with blocks, a published landing scheduled for tomorrow and one with no blocks.
        { locale: "es", translationKey: `${run}-c`, slug: `${run}-borrador`, title: "Borrador", blocks: valid },
        { status: "PUBLISHED", publishedAt: new Date(Date.now() + day), locale: "es", translationKey: `${run}-d`, slug: `${run}-futura`, title: "Futura", blocks: valid },
        { ...published, locale: "es", translationKey: `${run}-e`, slug: `${run}-vacia`, title: "Vacía" },
        // Stored blocks that no longer pass validation: an unsafe link, and a DatiHub block type.
        { ...published, locale: "es", translationKey: `${run}-f`, slug: `${run}-insegura`, title: "Insegura", blocks: blocks([button("javascript:alert(1)")]) },
        { ...published, locale: "es", translationKey: `${run}-g`, slug: `${run}-datihub`, title: "DatiHub", blocks: blocks([{ type: "Conversation", props: { id: "c" } }]) },
      ],
    });
  });

  afterAll(async () => {
    await db.landing.deleteMany({ where: { slug: { startsWith: run } } });
    await db.$disconnect();
  });

  it("returns a published landing of the locale with its validated blocks", async () => {
    const landing = await getLanding("es", `${run}-tiendas`);
    expect(landing?.title).toBe("Tiendas");
    expect(landing?.blocks.content[0]).toMatchObject({ type: "Button", props: { href: "/contacto" } });
  });

  it("re-validates stored blocks on read: blocks that fail are logged and the landing is not found", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getLanding("es", `${run}-insegura`)).toBeNull();
    expect(await getLanding("es", `${run}-datihub`)).toBeNull();
    expect(log).toHaveBeenCalledTimes(2);
    expect(String(log.mock.calls[0][0])).toContain("fail validation");
    log.mockRestore();
  });

  it("returns nothing for drafts, future publications, landings without blocks or other locales", async () => {
    expect(await getLanding("es", `${run}-borrador`)).toBeNull();
    expect(await getLanding("es", `${run}-futura`)).toBeNull();
    expect(await getLanding("es", `${run}-vacia`)).toBeNull();
    expect(await getLanding("en", `${run}-tiendas`)).toBeNull();
  });

  it("finds the translation of a slug from another locale", async () => {
    expect(await findLandingTranslation(`${run}-tiendas`, "en")).toEqual({ slug: `${run}-stores` });
    expect(await findLandingTranslation(`${run}-solo-es`, "en")).toEqual({ slug: null });
    expect(await findLandingTranslation(`${run}-borrador`, "en")).toBeNull();
    expect(await findLandingTranslation(`${run}-no-existe`, "en")).toBeNull();
  });

  it("maps every visible language version of a landing", async () => {
    expect(await landingTranslations(`${run}-a`)).toEqual({ es: `${run}-tiendas`, en: `${run}-stores` });
    expect(await landingTranslations(`${run}-c`)).toEqual({});
  });

  it("lists for the sitemap only the landings the public route renders", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const slugs = (await sitemapLandings()).map((landing) => landing.slug).filter((slug) => slug.startsWith(run));
    expect(slugs.sort()).toEqual([`${run}-solo-es`, `${run}-stores`, `${run}-tiendas`].sort());
    log.mockRestore();
  });
});
