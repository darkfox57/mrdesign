// @vitest-environment node
// TEMPORARY verifier probe (T12): violatesUnique against real P2002 errors from the local DB,
// and concurrent ingest of the same new tag / category.
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath }));
type Href = string | { pathname: string; params: { slug: string } };
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ locale, href, forcePrefix }: { locale: string; href: Href; forcePrefix?: boolean }) => {
    const path = typeof href === "string" ? href : href.pathname.replace("[slug]", href.params.slug);
    return `${forcePrefix || locale !== "es" ? `/${locale}` : ""}${path}`;
  },
}));
process.env.R2_PUBLIC_URL = "https://img.ingest.test";

const { db } = await import("../db");
const { isLocalDatabase } = await import("../is-local-database");
const { generateApiKey } = await import("../api-keys");
const { authenticateKey, ingestPost } = await import("./ingest");
const { violatesUnique } = await import("./unique-violation");

const local = isLocalDatabase(process.env.DATABASE_URL);
const run = `vfy-${Date.now()}`;
const fail = (p: Promise<unknown>) => p.then(() => { throw new Error("expected a unique violation"); }, (e: unknown) => e);

describe.skipIf(!local)("violatesUnique on real errors", () => {
  afterAll(async () => {
    await db.post.deleteMany({ where: { slug: { startsWith: run } } });
    await db.landing.deleteMany({ where: { slug: { startsWith: run } } });
    await db.tag.deleteMany({ where: { slug: { startsWith: run } } });
    await db.category.deleteMany({ where: { slug: { startsWith: run } } });
    await db.apiKey.deleteMany({ where: { name: { startsWith: run } } });
    await db.user.deleteMany({ where: { email: { startsWith: run } } });
  });

  const postData = (slug: string, translationKey: string, locale = "es") => ({
    locale: locale as "es",
    slug,
    title: "t",
    excerpt: "e",
    content: "<p>c</p>",
    translationKey,
  });

  it("Post translationKey+locale and locale+slug", async () => {
    await db.post.create({ data: postData(`${run}-p1`, `${run}-tk1`) });
    const tk = await fail(db.post.create({ data: postData(`${run}-p2`, `${run}-tk1`) }));
    console.log("POST TK META", JSON.stringify((tk as { meta?: unknown }).meta));
    expect(violatesUnique(tk, "Post", ["translationKey", "locale"])).toBe(true);
    expect(violatesUnique(tk, "Post", ["locale", "slug"])).toBe(false);
    const sl = await fail(db.post.create({ data: postData(`${run}-p1`, `${run}-tk2`) }));
    console.log("POST SLUG META", JSON.stringify((sl as { meta?: unknown }).meta));
    expect(violatesUnique(sl, "Post", ["locale", "slug"])).toBe(true);
    expect(violatesUnique(sl, "Post", ["translationKey", "locale"])).toBe(false);
    expect(violatesUnique(sl, "Tag")).toBe(false);
    // Through an interactive transaction, as ingest does.
    const tx = await fail(db.$transaction(async (t) => t.post.create({ data: postData(`${run}-p1`, `${run}-tk3`) })));
    expect(violatesUnique(tx, "Post", ["locale", "slug"])).toBe(true);
  });

  it("Landing translationKey+locale and locale+slug", async () => {
    const data = (slug: string, translationKey: string) => ({ locale: "es" as const, slug, title: "t", translationKey, blocks: { root: { props: {} }, content: [] } });
    await db.landing.create({ data: data(`${run}-l1`, `${run}-ltk1`) });
    const tk = await fail(db.landing.create({ data: data(`${run}-l2`, `${run}-ltk1`) }));
    expect(violatesUnique(tk, "Landing", ["translationKey", "locale"])).toBe(true);
    const sl = await fail(db.landing.create({ data: data(`${run}-l1`, `${run}-ltk2`) }));
    expect(violatesUnique(sl, "Landing", ["translationKey", "locale"])).toBe(false);
  });

  it("Tag and Category (slug and name)", async () => {
    for (const model of ["tag", "category"] as const) {
      const create = (data: { slug: string; name: string }) =>
        model === "tag" ? db.tag.create({ data: { locale: "es", ...data } }) : db.category.create({ data: { locale: "es", ...data } });
      await create({ slug: `${run}-${model}`, name: `${run} ${model}` });
      const bySlug = await fail(create({ slug: `${run}-${model}`, name: `${run} other ${model}` }));
      const byName = await fail(create({ slug: `${run}-${model}-2`, name: `${run} ${model}` }));
      const Model = model === "tag" ? "Tag" : "Category";
      const Other = model === "tag" ? "Category" : "Tag";
      console.log(Model, "META", JSON.stringify((byName as { meta?: unknown }).meta));
      expect(violatesUnique(bySlug, Model)).toBe(true);
      expect(violatesUnique(byName, Model)).toBe(true);
      expect(violatesUnique(bySlug, Other)).toBe(false);
      expect(violatesUnique(bySlug, "Post")).toBe(false);
    }
  });

  it("does not match unrelated unique errors", async () => {
    const { prefix, keyHash } = generateApiKey();
    await db.apiKey.create({ data: { name: `${run} k`, prefix, keyHash } });
    const key = await fail(db.apiKey.create({ data: { name: `${run} k2`, prefix, keyHash } }));
    for (const model of ["Post", "Tag", "Category", "Landing"]) expect(violatesUnique(key, model)).toBe(false);
    expect(violatesUnique(key, "Post", ["locale", "slug"])).toBe(false);
  });

  it("concurrent identical new tag/category: 400 or 201, never 500, nothing partial", async () => {
    const { key } = generateApiKey();
    const raw = generateApiKey();
    await db.apiKey.create({ data: { name: `${run} ingest`, prefix: raw.prefix, keyHash: raw.keyHash, publishImmediately: false } });
    const auth = await authenticateKey(raw.key);
    void key;
    if (!auth) throw new Error("no key");
    const outcomes: string[] = [];
    for (let round = 0; round < 8; round++) {
      const tag = `${run} conc tag ${round}`;
      const cat = `${run} conc cat ${round}`;
      const bodies = [0, 1, 2, 3].map((i) => ({
        title: "T",
        slug: `${run}-c${round}-${i}`,
        description: "d",
        content: "<p>x</p>",
        tags: [tag, `${run} extra ${round} ${i}`],
        categories: [cat],
      }));
      const results = await Promise.all(bodies.map((b) => ingestPost(auth, b).catch((e: unknown) => ({ status: 500, body: String(e) }))));
      for (const [i, r] of results.entries()) {
        outcomes.push(`${round}:${r.status}:${JSON.stringify(r.body).slice(0, 120)}`);
        expect([201, 400]).toContain(r.status);
        const stored = await db.post.count({ where: { slug: bodies[i].slug } });
        expect(stored).toBe(r.status === 201 ? 1 : 0);
        if (r.status === 400) {
          // The per-request extra tag must not survive a rolled-back request.
          expect(await db.tag.count({ where: { name: `${run} extra ${round} ${i}` } })).toBe(0);
        }
      }
      expect(await db.tag.count({ where: { name: tag } })).toBe(1);
      expect(await db.category.count({ where: { name: cat } })).toBe(1);
    }
    console.log("CONCURRENT", outcomes.join("\n"));
  }, 60_000);
  it("concurrent tag-only and same-slug ingest", async () => {
    const raw = generateApiKey();
    await db.apiKey.create({ data: { name: `${run} ingest2`, prefix: raw.prefix, keyHash: raw.keyHash, publishImmediately: false } });
    const auth = await authenticateKey(raw.key);
    if (!auth) throw new Error("no key");
    const out: string[] = [];
    for (let round = 0; round < 5; round++) {
      const tag = `${run} only tag ${round}`;
      const rs = await Promise.all([0, 1, 2, 3].map((i) => ingestPost(auth, { title: "T", slug: `${run}-t${round}-${i}`, description: "d", content: "<p>x</p>", tags: tag }).catch((e: unknown) => ({ status: 500, body: String(e) }))));
      for (const r of rs) { out.push(`tag ${round}:${r.status}:${JSON.stringify(r.body).slice(0, 100)}`); expect([201, 400]).toContain(r.status); }
      expect(await db.tag.count({ where: { name: tag } })).toBe(1);
      const same = await Promise.all([0, 1, 2].map(() => ingestPost(auth, { title: "T", slug: `${run}-same-${round}`, description: "d", content: "<p>x</p>" }).catch((e: unknown) => ({ status: 500, body: String(e) }))));
      for (const r of same) { out.push(`slug ${round}:${r.status}:${JSON.stringify(r.body).slice(0, 100)}`); expect([201, 400]).toContain(r.status); }
      expect(await db.post.count({ where: { slug: `${run}-same-${round}` } })).toBe(1);
    }
    console.log("CONC2", out.join(" | "));
  }, 60_000);
});
