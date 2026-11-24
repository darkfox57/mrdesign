// @vitest-environment node
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { isLocalDatabase } from "../is-local-database";
import { LANDING_CONFLICT, LANDING_GONE, changePublication, discardDraft, publishPage, saveDraft } from "./editor";

const run = `t${Date.now()}`;
const PREFIXES = ["https://media.editor.test/bucket/media/"];

const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase
  ? "landing editor writes"
  : "landing editor writes (skipped: DATABASE_URL is not the local docker database, see .env.example)";

const button = (label: string) => ({ type: "Button", props: { id: "b", label, href: "/contacto", variant: "primary", align: "left" } });
const page = (label: string, slug = `${run}-landing`) => ({ root: { props: { title: "Landing", slug } }, content: [button(label)] });

type Row = { id: string; updatedAt: Date };
let landing: Row;
let counter = 0;

const stored = (id: string) => db.landing.findUniqueOrThrow({ where: { id } });
const label = (json: Prisma.JsonValue | null) => (json as { content: { props: { label: string } }[] } | null)?.content[0]?.props.label;

describe.skipIf(!runAgainstDatabase)(title, () => {
  beforeEach(async () => {
    counter += 1;
    landing = await db.landing.create({
      data: {
        locale: "es",
        slug: `${run}-${counter}`,
        title: "Landing",
        blocks: page("Publicado", `${run}-${counter}`) as Prisma.InputJsonValue,
      },
      select: { id: true, updatedAt: true },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await db.landing.deleteMany({ where: { slug: { startsWith: run } } });
    await db.$disconnect();
  });

  const version = () => landing.updatedAt.toISOString();
  const ownPage = (text: string) => page(text, `${run}-${counter}`);

  it("saves with the version the editor loaded and returns the next one, so consecutive saves keep working", async () => {
    const first = await saveDraft(landing.id, version(), ownPage("Uno"), PREFIXES);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.version).not.toBe(version());
    expect(first.version).toBe((await stored(landing.id)).updatedAt.toISOString());

    const second = await saveDraft(landing.id, first.version, ownPage("Dos"), PREFIXES);
    expect(second.ok).toBe(true);
    expect(label((await stored(landing.id)).draftBlocks)).toBe("Dos");
  });

  it("refuses a second save with the same stale version and keeps the first one's draft", async () => {
    expect((await saveDraft(landing.id, version(), ownPage("Primero"), PREFIXES)).ok).toBe(true);
    const stale = await saveDraft(landing.id, version(), ownPage("Segundo"), PREFIXES);
    expect(stale).toEqual({ ok: false, errors: [LANDING_CONFLICT] });
    expect(LANDING_CONFLICT).toBe("Alguien más guardó esta landing mientras la editabas. Recarga la página para ver la versión actual.");
    expect(label((await stored(landing.id)).draftBlocks)).toBe("Primero");
  });

  it("lets only one of two simultaneous saves with the same version through", async () => {
    const results = await Promise.all([
      saveDraft(landing.id, version(), ownPage("A"), PREFIXES),
      saveDraft(landing.id, version(), ownPage("B"), PREFIXES),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toEqual([{ ok: false, errors: [LANDING_CONFLICT] }]);
  });

  it("refuses a publish with a stale version: the published page, the draft and the status stay", async () => {
    expect((await saveDraft(landing.id, version(), ownPage("Borrador de otro"), PREFIXES)).ok).toBe(true);
    const stale = await publishPage(landing.id, version(), ownPage("Pisaría"), PREFIXES);
    expect(stale).toEqual({ ok: false, errors: [LANDING_CONFLICT] });
    const row = await stored(landing.id);
    expect(label(row.blocks)).toBe("Publicado");
    expect(label(row.draftBlocks)).toBe("Borrador de otro");
    expect(row.status).toBe("DRAFT");
  });

  it("publishes with the current version: blocks, page fields and status change, the draft is cleared", async () => {
    const saved = await saveDraft(landing.id, version(), ownPage("Borrador"), PREFIXES);
    if (!saved.ok) throw new Error("save failed");
    const published = await publishPage(landing.id, saved.version, ownPage("Final"), PREFIXES);
    expect(published.ok).toBe(true);
    const row = await stored(landing.id);
    expect(label(row.blocks)).toBe("Final");
    expect(row.draftBlocks).toBeNull();
    expect(row.status).toBe("PUBLISHED");
    expect(row.publishedAt).not.toBeNull();
  });

  it("refuses a discard with a stale version and keeps the draft", async () => {
    expect((await saveDraft(landing.id, version(), ownPage("Nuevo"), PREFIXES)).ok).toBe(true);
    expect(await discardDraft(landing.id, version())).toEqual({ ok: false, errors: [LANDING_CONFLICT] });
    expect(label((await stored(landing.id)).draftBlocks)).toBe("Nuevo");
  });

  it("discards with the current version", async () => {
    const saved = await saveDraft(landing.id, version(), ownPage("Nuevo"), PREFIXES);
    if (!saved.ok) throw new Error("save failed");
    expect((await discardDraft(landing.id, saved.version)).ok).toBe(true);
    expect((await stored(landing.id)).draftBlocks).toBeNull();
  });

  it("treats a malformed version as stale and writes nothing", async () => {
    for (const bad of ["", "yesterday", 5, null]) {
      expect(await saveDraft(landing.id, bad, ownPage("X"), PREFIXES), String(bad)).toEqual({ ok: false, errors: [LANDING_CONFLICT] });
    }
    expect((await stored(landing.id)).draftBlocks).toBeNull();
  });

  it("answers that the landing is gone for a deleted or malformed id", async () => {
    await db.landing.delete({ where: { id: landing.id } });
    expect(await saveDraft(landing.id, version(), ownPage("X"), PREFIXES)).toEqual({ ok: false, errors: [LANDING_GONE] });
    expect(await discardDraft(landing.id, version())).toEqual({ ok: false, errors: [LANDING_GONE] });
    expect(await publishPage("../x", version(), ownPage("X"), PREFIXES)).toEqual({ ok: false, errors: [LANDING_GONE] });
  });

  describe("changePublication", () => {
    it("publishes and unpublishes from the list", async () => {
      expect(await changePublication(landing.id, "publish")).toEqual({});
      expect((await stored(landing.id)).status).toBe("PUBLISHED");
      expect(await changePublication(landing.id, "unpublish")).toEqual({});
      expect((await stored(landing.id)).status).toBe("DRAFT");
    });

    it("answers that the landing is gone when it disappears between the read and the write", async () => {
      await db.landing.delete({ where: { id: landing.id } });
      // The read still sees the row; the write finds nothing.
      vi.spyOn(db.landing, "findUnique").mockResolvedValueOnce({ status: "DRAFT", publishedAt: null, blocks: {} } as never);
      expect(await changePublication(landing.id, "publish")).toEqual({ error: LANDING_GONE });
    });

    it("refuses an archived landing, as the list does, and leaves it archived", async () => {
      await db.landing.update({ where: { id: landing.id }, data: { status: "ARCHIVED" } });
      for (const intent of ["publish", "unpublish"] as const) {
        expect(await changePublication(landing.id, intent)).toEqual({ error: "Esta landing está archivada: no se publica ni se despublica desde la lista." });
      }
      expect((await stored(landing.id)).status).toBe("ARCHIVED");
    });

    it("refuses to publish a landing with no page yet", async () => {
      await db.landing.update({ where: { id: landing.id }, data: { blocks: Prisma.DbNull } });
      const outcome = await changePublication(landing.id, "publish");
      expect(outcome.error).toBe("Esta landing todavía no tiene página. Ármala y publícala desde el editor visual.");
    });
  });
});
