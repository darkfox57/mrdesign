// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../db";
import { isLocalDatabase } from "../is-local-database";
import {
  categoryTranslations,
  findCategoryTranslation,
  findPostTranslation,
  getCategory,
  getPost,
  listCategories,
  listPosts,
  postTranslations,
  relatedPosts,
  sitemapBlogEntries,
} from "./posts";

const run = `t${Date.now()}`;
const day = 24 * 60 * 60 * 1000;

// These tests create and delete rows: they only run against a local database (docker compose).
const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase
  ? "blog queries"
  : "blog queries (skipped: DATABASE_URL is not the local docker database, see .env.example)";

describe.skipIf(!runAgainstDatabase)(title, () => {
  const categoryKey = `${run}-cat`;
  const postKey = `${run}-post`;

  beforeAll(async () => {
    const esCategory = await db.category.create({
      data: { locale: "es", translationKey: categoryKey, name: `${run} Categoría`, slug: `${run}-categoria` },
    });
    const enCategory = await db.category.create({
      data: { locale: "en", translationKey: categoryKey, name: `${run} Category`, slug: `${run}-category` },
    });
    const published = (offsetDays: number) => ({ status: "PUBLISHED" as const, publishedAt: new Date(Date.now() - offsetDays * day) });
    const base = { excerpt: "Resumen", content: "<p>Cuerpo</p>" };

    await db.post.create({
      data: { ...base, ...published(1), locale: "es", translationKey: postKey, title: "Nuevo", slug: `${run}-nuevo`, categories: { connect: { id: esCategory.id } } },
    });
    await db.post.create({
      data: { ...base, ...published(1), locale: "en", translationKey: postKey, title: "New", slug: `${run}-new`, categories: { connect: { id: enCategory.id } } },
    });
    await db.post.create({
      data: { ...base, ...published(3), locale: "es", title: "Viejo", slug: `${run}-viejo`, categories: { connect: { id: esCategory.id } } },
    });
    await db.post.create({ data: { ...base, ...published(2), locale: "es", title: "Sin categoría", slug: `${run}-suelto` } });
    await db.post.create({ data: { ...base, locale: "es", title: "Borrador", slug: `${run}-borrador` } });
    await db.post.create({ data: { ...base, ...published(10), locale: "es", source: "API", title: "Importado", slug: `${run}-importado` } });
    await db.post.create({ data: { ...base, status: "ARCHIVED", publishedAt: new Date(Date.now() - day), locale: "es", title: "Archivado", slug: `${run}-archivado` } });
    // A category whose only posts are drafts, in Spanish and English.
    const draftKey = `${run}-draft-cat`;
    for (const locale of ["es", "en"] as const) {
      await db.category.create({
        data: {
          locale,
          translationKey: draftKey,
          name: `${run} Borradores ${locale}`,
          slug: `${run}-borradores-${locale}`,
          posts: { create: { ...base, locale, title: "Solo borrador", slug: `${run}-solo-borrador-${locale}` } },
        },
      });
    }
    await db.post.create({
      data: { ...base, status: "PUBLISHED", publishedAt: new Date(Date.now() + day), locale: "es", title: "Futuro", slug: `${run}-futuro` },
    });
  });

  afterAll(async () => {
    await db.post.deleteMany({ where: { slug: { startsWith: run } } });
    await db.category.deleteMany({ where: { slug: { startsWith: run } } });
    await db.$disconnect();
  });

  const mine = (posts: { slug: string }[]) => posts.map((post) => post.slug).filter((slug) => slug.startsWith(run));

  it("lists only published posts of the locale, newest first", async () => {
    const { posts } = await listPosts({ locale: "es", page: 1, pageSize: 100 });
    expect(mine(posts)).toEqual([`${run}-nuevo`, `${run}-suelto`, `${run}-viejo`, `${run}-importado`]);
  });

  it("filters by category and paginates", async () => {
    const category = await getCategory("es", `${run}-categoria`);
    const first = await listPosts({ locale: "es", page: 1, pageSize: 1, categoryId: category!.id });
    const second = await listPosts({ locale: "es", page: 2, pageSize: 1, categoryId: category!.id });
    expect(first.total).toBe(2);
    expect(first.pages).toBe(2);
    expect(mine(first.posts)).toEqual([`${run}-nuevo`]);
    expect(mine(second.posts)).toEqual([`${run}-viejo`]);
  });

  it("returns a published post with its categories, and nothing for drafts, future posts or other locales", async () => {
    const post = await getPost("es", `${run}-nuevo`);
    expect(post?.title).toBe("Nuevo");
    expect(post?.categories.map((category) => category.slug)).toEqual([`${run}-categoria`]);
    expect(await getPost("es", `${run}-borrador`)).toBeNull();
    expect(await getPost("es", `${run}-futuro`)).toBeNull();
    expect(await getPost("en", `${run}-nuevo`)).toBeNull();
  });

  it("finds the translation of a slug from another locale", async () => {
    expect(await findPostTranslation(`${run}-nuevo`, "en")).toEqual({ slug: `${run}-new` });
    // Published, but not translated to English.
    expect(await findPostTranslation(`${run}-viejo`, "en")).toEqual({ slug: null });
    // Drafts and unknown slugs are not visible anywhere.
    expect(await findPostTranslation(`${run}-borrador`, "en")).toBeNull();
    expect(await findPostTranslation(`${run}-no-existe`, "en")).toBeNull();
    expect(await findCategoryTranslation(`${run}-categoria`, "en")).toBe(`${run}-category`);
  });

  it("hides categories without published posts, also as translations", async () => {
    expect(await getCategory("es", `${run}-borradores-es`)).toBeNull();
    expect(await findCategoryTranslation(`${run}-borradores-es`, "en")).toBeNull();
    expect(await findCategoryTranslation(`${run}-categoria`, "es")).toBe(`${run}-categoria`);
  });

  it("maps every visible language version of a post and a category", async () => {
    expect(await postTranslations(postKey)).toEqual({ es: `${run}-nuevo`, en: `${run}-new` });
    expect(await categoryTranslations(categoryKey)).toEqual({ es: `${run}-categoria`, en: `${run}-category` });
    expect(await categoryTranslations(`${run}-draft-cat`)).toEqual({});
  });

  it("keeps a single page when a listing is empty, so an empty blog is never a 404", async () => {
    const draftsOnly = await db.category.findFirstOrThrow({ where: { slug: `${run}-borradores-es` } });
    expect(await listPosts({ locale: "es", page: 1, categoryId: draftsOnly.id })).toEqual({ posts: [], total: 0, pages: 1 });
  });

  it("returns nothing for archived posts, also as a translation", async () => {
    expect(await getPost("es", `${run}-archivado`)).toBeNull();
    expect(await findPostTranslation(`${run}-archivado`, "en")).toBeNull();
  });

  it("lists every visible post and category for the sitemap, without drafts", async () => {
    const { posts, categories } = await sitemapBlogEntries();
    const slugs = posts.map((post) => post.slug).filter((slug) => slug.startsWith(run)).sort();
    expect(slugs).toEqual([`${run}-importado`, `${run}-new`, `${run}-nuevo`, `${run}-suelto`, `${run}-viejo`]);
    expect(categories.map((category) => category.slug).filter((slug) => slug.startsWith(run)).sort()).toEqual([
      `${run}-categoria`,
      `${run}-category`,
    ]);
  });

  it("lists categories with published posts and their count", async () => {
    const categories = (await listCategories("es")).filter((category) => category.slug.startsWith(run));
    expect(categories).toEqual([expect.objectContaining({ slug: `${run}-categoria`, postCount: 2 })]);
  });

  it("relates posts that share a category, excluding the post itself", async () => {
    const post = await getPost("es", `${run}-nuevo`);
    expect(mine(await relatedPosts(post!, 3))).toEqual([`${run}-viejo`]);
  });
});
