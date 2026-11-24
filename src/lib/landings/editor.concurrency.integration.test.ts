import { afterAll, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isLocalDatabase } from "@/lib/is-local-database";
import { LANDING_CONFLICT, LANDING_GONE, changePublication, discardDraft, publishPage, saveDraft } from "@/lib/landings/editor";
import { editorStartData, EDITOR_NOTICES, hasLandingDraft, parseLandingId } from "@/lib/admin/landing-create";
import { validateBuilderData } from "@/lib/visual-builder/validate";

// Writes rows: runs only against the local Docker database (docs/admin.md rule 7).
const skip = !isLocalDatabase(process.env.DATABASE_URL);

const run = `vprobe${Date.now()}`;
const P = ["https://media.editor.test/bucket/media/"];
const button = (label: string, id = "b") => ({ type: "Button", props: { id, label, href: "/contacto", variant: "primary", align: "left" } });
let n = 0;
const page = (label: string, slug: string) => ({ root: { props: { title: "L", slug } }, content: [button(label)] });
const lab = (j: unknown) => (j as { content: { props: { label: string } }[] } | null)?.content[0]?.props.label ?? null;

async function fresh() {
  n += 1;
  const slug = `${run}-${n}`;
  const row = await db.landing.create({
    data: { locale: "es", slug, title: "L", blocks: page("Pub", slug) as Prisma.InputJsonValue },
    select: { id: true, updatedAt: true },
  });
  return { id: row.id, v: row.updatedAt.toISOString(), slug };
}
const get = (id: string) => db.landing.findUniqueOrThrow({ where: { id } });

afterAll(async () => {
  if (skip) return;
  await db.landing.deleteMany({ where: { slug: { startsWith: run } } });
  await db.$disconnect();
});

describe.skipIf(skip)("concurrency, real parallel calls", () => {
  it("pairs of ops with the same version: exactly one wins, loser gets conflict, state matches winner (40 iterations x 6 pairs)", async () => {
    type Op = "save" | "publish" | "discard";
    const pairs: [Op, Op][] = [["save", "save"], ["save", "publish"], ["publish", "save"], ["publish", "publish"], ["save", "discard"], ["discard", "publish"]];
    const tally: Record<string, number> = {};
    for (let i = 0; i < 40; i++) {
      for (const [a, b] of pairs) {
        const l = await fresh();
        // seed a draft so discard has something to do
        const seeded = await saveDraft(l.id, l.v, page("Seed", l.slug), P);
        if (!seeded.ok) throw new Error("seed");
        const exec = (op: Op, tag: string) =>
          op === "save" ? saveDraft(l.id, seeded.version, page(tag, l.slug), P)
          : op === "publish" ? publishPage(l.id, seeded.version, page(tag, l.slug), P)
          : discardDraft(l.id, seeded.version);
        const [ra, rb] = await Promise.all([exec(a, "A"), exec(b, "B")]);
        const oks = [ra, rb].filter((r) => r.ok);
        expect(oks.length, `${a}/${b}`).toBe(1);
        const loser = ra.ok ? rb : ra;
        expect(loser).toEqual({ ok: false, errors: [LANDING_CONFLICT] });
        const winnerOp = ra.ok ? a : b;
        const winnerTag = ra.ok ? "A" : "B";
        tally[`${a}/${b} -> ${winnerTag}`] = (tally[`${a}/${b} -> ${winnerTag}`] ?? 0) + 1;
        const row = await get(l.id);
        if (winnerOp === "save") { expect(lab(row.draftBlocks)).toBe(winnerTag); expect(lab(row.blocks)).toBe("Pub"); expect(row.status).toBe("DRAFT"); }
        if (winnerOp === "publish") { expect(lab(row.blocks)).toBe(winnerTag); expect(row.draftBlocks).toBeNull(); expect(row.status).toBe("PUBLISHED"); }
        if (winnerOp === "discard") { expect(row.draftBlocks).toBeNull(); expect(lab(row.blocks)).toBe("Pub"); expect(row.status).toBe("DRAFT"); }
        expect(row.updatedAt.toISOString()).toBe((ra.ok ? ra : rb as { version: string }).version);
      }
    }
  }, 600000);

  it("8 parallel saves with one version: exactly one wins", async () => {
    for (let i = 0; i < 10; i++) {
      const l = await fresh();
      const rs = await Promise.all(Array.from({ length: 8 }, (_, k) => saveDraft(l.id, l.v, page(`S${k}`, l.slug), P)));
      expect(rs.filter((r) => r.ok)).toHaveLength(1);
    }
  });

  it("publish after a concurrent save by another editor is refused (save first, then stale publish)", async () => {
    const l = await fresh();
    const a = await saveDraft(l.id, l.v, page("A-draft", l.slug), P);
    expect(a.ok).toBe(true);
    const b = await publishPage(l.id, l.v, page("B-pub", l.slug), P);
    expect(b).toEqual({ ok: false, errors: [LANDING_CONFLICT] });
    const row = await get(l.id);
    expect(lab(row.blocks)).toBe("Pub");
    expect(lab(row.draftBlocks)).toBe("A-draft");
  });

  it("same millisecond: frozen clock, 20 consecutive writes all get distinct, increasing versions", async () => {
    const l = await fresh();
    const frozen = new Date(l.v).getTime(); // clock equal to the row's version
    const spy = vi.spyOn(Date, "now").mockReturnValue(frozen);
    let v = l.v;
    const seen = new Set<string>([v]);
    for (let i = 0; i < 20; i++) {
      const r = i % 3 === 2 ? await discardDraft(l.id, v) : await saveDraft(l.id, v, page(`F${i}`, l.slug), P);
      expect(r.ok, `write ${i}`).toBe(true);
      if (!r.ok) break;
      expect(new Date(r.version).getTime()).toBeGreaterThan(new Date(v).getTime());
      expect(seen.has(r.version)).toBe(false);
      seen.add(r.version);
      v = r.version;
    }
    spy.mockRestore();
    // the old version no longer matches
    expect(await saveDraft(l.id, l.v, page("old", l.slug), P)).toEqual({ ok: false, errors: [LANDING_CONFLICT] });
  });

  it("real clock: 30 back-to-back saves distinct versions", async () => {
    const l = await fresh();
    let v = l.v;
    const seen = new Set([v]);
    for (let i = 0; i < 30; i++) {
      const r = await saveDraft(l.id, v, page(`R${i}`, l.slug), P);
      expect(r.ok).toBe(true);
      if (!r.ok) break;
      expect(seen.has(r.version)).toBe(false);
      seen.add(r.version);
      v = r.version;
    }
  });

  it("stale or malformed versions never write", async () => {
    const l = await fresh();
    const s = await saveDraft(l.id, l.v, page("Base", l.slug), P);
    if (!s.ok) throw new Error();
    const cur = new Date(s.version).getTime();
    const bad: unknown[] = [
      "", " ", "yesterday", 0, 5, null, undefined, {}, [], [s.version], { toString: () => s.version },
      new Date(cur).toISOString().replace("Z", "+00:00"),
      new Date(cur).toUTCString(),
      String(cur),
      new Date(cur + 1).toISOString(), new Date(cur - 1).toISOString(),
      "9999-12-31T23:59:59.999Z", "1970-01-01T00:00:00.000Z",
      l.v, // the original stale version
      s.version + "' OR '1'='1",
      "x".repeat(100000),
    ];
    const before = JSON.stringify(await get(l.id));
    for (const b of bad) {
      const r1 = await saveDraft(l.id, b, page("Evil", l.slug), P);
      const r2 = await publishPage(l.id, b, page("Evil", l.slug), P);
      const r3 = await discardDraft(l.id, b);
      for (const r of [r1, r2, r3]) expect(r, `bad=${String(b).slice(0, 40)}`).toEqual({ ok: false, errors: [LANDING_CONFLICT] });
    }
    expect(JSON.stringify(await get(l.id))).toBe(before);
    // same instant, other precision: equal value is the same version, accepted (not a bypass)
    const sub = s.version.replace("Z", "1Z");
    const r = await saveDraft(l.id, sub, page("Precise", l.slug), P);
    expect(r.ok).toBe(true);
  });

  it("changePublication bumps updatedAt so an open editor sees a conflict", async () => {
    const l = await fresh();
    expect(await changePublication(l.id, "publish")).toEqual({});
    const row = await get(l.id);
    expect(row.updatedAt.toISOString()).not.toBe(l.v);
    expect(await saveDraft(l.id, l.v, page("x", l.slug), P)).toEqual({ ok: false, errors: [LANDING_CONFLICT] });
  });

  it("gone: deleted row, malformed id", async () => {
    const l = await fresh();
    await db.landing.delete({ where: { id: l.id } });
    expect(await publishPage(l.id, l.v, page("x", l.slug), P)).toEqual({ ok: false, errors: [LANDING_GONE] });
    expect(await changePublication(l.id, "publish")).toEqual({ error: LANDING_GONE });
    for (const id of ["", "a b", "../x", "x".repeat(101), null, 5, "ñ", "a%2Fb"]) {
      expect(await saveDraft(id, l.v, page("x", l.slug), P)).toEqual({ ok: false, errors: [LANDING_GONE] });
    }
  });
});

describe.skipIf(skip)("validation", () => {
  const cols = (left: number, right: number) => ({
    type: "Columns",
    props: { id: `c${left}-${right}`, ratio: "1-1", background: "paper", left: Array.from({ length: left }, (_, i) => button("x", `l${i}`)), right: Array.from({ length: right }, (_, i) => button("x", `r${i}`)) },
  });
  it("nested count: 100 accepted, 101 rejected", () => {
    const p100 = { content: [cols(50, 49)] };
    const p101 = { content: [cols(50, 50)] };
    expect(validateBuilderData(p100).success).toBe(true);
    const r = validateBuilderData(p101);
    expect(r.success).toBe(false);
    // 100 top-level still accepted, 101 rejected
    expect(validateBuilderData({ content: Array.from({ length: 100 }, (_, i) => button("x", `t${i}`)) }).success).toBe(true);
    expect(validateBuilderData({ content: Array.from({ length: 101 }, (_, i) => button("x", `t${i}`)) }).success).toBe(false);
    // mixed: 50 top-level, 1 columns with 49 children = 100
    expect(validateBuilderData({ content: [...Array.from({ length: 50 }, (_, i) => button("x", `t${i}`)), cols(25, 24)] }).success).toBe(true);
    expect(validateBuilderData({ content: [...Array.from({ length: 50 }, (_, i) => button("x", `t${i}`)), cols(25, 25)] }).success).toBe(false);
    // hero side counts too
    const hero = (k: number) => ({ type: "Hero", props: { id: "h", eyebrow: "", title: "t", lead: "", primaryLabel: "", primaryHref: "", secondaryLabel: "", secondaryHref: "", background: "paper", side: Array.from({ length: k }, (_, i) => button("x", `s${i}`)) } });
    expect(validateBuilderData({ content: [hero(49), cols(25, 24)] }).success).toBe(true);
    expect(validateBuilderData({ content: [hero(50), cols(25, 24)] }).success).toBe(false);
    // depth: columns inside columns is still refused
    const nested = { type: "Columns", props: { id: "o", ratio: "1-1", background: "paper", left: [cols(1, 0)], right: [] } };
    const d = validateBuilderData({ content: [nested] });
    expect(d.success).toBe(false);
  });

  it("every landing currently stored in the local DB still validates (blocks and draftBlocks)", async () => {
    const rows = await db.landing.findMany({ select: { slug: true, blocks: true, draftBlocks: true } });
    const failing: string[] = [];
    for (const r of rows) {
      for (const [k, v] of [["blocks", r.blocks], ["draftBlocks", r.draftBlocks]] as const) {
        if (v === null) continue;
        const res = validateBuilderData(v);
        if (!res.success) failing.push(`${r.slug}.${k}: ${res.errors.join("|")}`);
      }
    }
    expect(failing).toEqual([]);
  });

  it("parseLandingId", async () => {
    const real = await db.landing.findMany({ select: { id: true }, take: 20 });
    for (const r of real) expect(parseLandingId(r.id)).toBe(r.id);
    for (const bad of ["", " ", "a b", "../x", "x/y", "x".repeat(101), "ñ", "a%2F", "id\n", null, 5, {}, ["c1"]]) expect(parseLandingId(bad), String(bad)).toBeNull();
    expect(parseLandingId("x".repeat(100))).toBe("x".repeat(100));
  });

  it("editorStartData fallbacks", () => {
    const base = { title: "T", slug: "s", seoTitle: null, seoDescription: null };
    const valid = { root: { props: { title: "Draft T", slug: "ds" } }, content: [button("ok")] };
    const invalid = { root: { props: {} }, content: [{ type: "Script", props: { id: "x" } }] };
    const withExtra = { root: { props: { title: "Draft T" } }, content: [{ ...button("ok"), props: { ...button("ok").props, onclick: "evil" } }] };
    const a = editorStartData({ ...base, draftBlocks: valid, blocks: invalid });
    expect(a.notice).toBeNull(); expect(a.data.root.props.title).toBe("Draft T"); expect(lab(a.data)).toBe("ok");
    const b = editorStartData({ ...base, draftBlocks: invalid, blocks: { content: [button("pub")] } });
    expect(b.notice).toBe(EDITOR_NOTICES.invalidDraft); expect(lab(b.data)).toBe("pub"); expect(b.data.root.props.title).toBe("T");
    const c = editorStartData({ ...base, draftBlocks: invalid, blocks: invalid });
    expect(c.notice).toBe(EDITOR_NOTICES.invalidPage); expect(c.data.content).toEqual([]);
    const d = editorStartData({ ...base, draftBlocks: null, blocks: null });
    expect(d.notice).toBeNull(); expect(d.data.content).toEqual([]);
    const e = editorStartData({ ...base, draftBlocks: null, blocks: invalid });
    expect(e.notice).toBe(EDITOR_NOTICES.invalidPage); expect(e.data.content).toEqual([]);
    const f = editorStartData({ ...base, draftBlocks: invalid, blocks: null });
    expect(f.notice).toBe(EDITOR_NOTICES.invalidPage);
    const g = editorStartData({ ...base, draftBlocks: withExtra, blocks: null });
    expect(g.notice).toBe(EDITOR_NOTICES.invalidPage); expect(g.data.content).toEqual([]);
    const h = editorStartData({ ...base, draftBlocks: "garbage", blocks: 42 });
    expect(h.data.content).toEqual([]); expect(h.notice).toBe(EDITOR_NOTICES.invalidPage);
    expect(hasLandingDraft({ draftBlocks: null })).toBe(false);
    expect(hasLandingDraft({ draftBlocks: {} })).toBe(true);
  });

});
