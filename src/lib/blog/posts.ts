import type { Locale } from "@/i18n/routing";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";

export const POSTS_PER_PAGE = 12;

// The one visibility rule of the public blog: published, with a publication date already reached.
// Drafts and archived posts never leave the dashboard.
function visible(locale?: Locale): Prisma.PostWhereInput {
  return { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...(locale ? { locale } : {}) };
}

const cardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  coverImageAlt: true,
  publishedAt: true,
  categories: { select: { name: true, slug: true } },
} satisfies Prisma.PostSelect;

export type PostCard = Prisma.PostGetPayload<{ select: typeof cardSelect }>;

export async function listPosts({
  locale,
  page,
  pageSize = POSTS_PER_PAGE,
  categoryId,
}: {
  locale: Locale;
  page: number;
  pageSize?: number;
  categoryId?: string;
}) {
  const where: Prisma.PostWhereInput = {
    ...visible(locale),
    ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
  };
  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      select: cardSelect,
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.post.count({ where }),
  ]);
  return { posts, total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPost(locale: Locale, slug: string) {
  return db.post.findFirst({
    where: { ...visible(locale), slug },
    include: {
      author: { select: { name: true } },
      categories: { select: { id: true, name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
    },
  });
}

export type Post = NonNullable<Awaited<ReturnType<typeof getPost>>>;

export async function relatedPosts(post: Post, limit: number): Promise<PostCard[]> {
  if (post.categories.length === 0) return [];
  return db.post.findMany({
    where: {
      ...visible(post.locale),
      id: { not: post.id },
      categories: { some: { id: { in: post.categories.map((category) => category.id) } } },
    },
    select: cardSelect,
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    take: limit,
  });
}

// A slug opened in the wrong locale (for example from the language switcher, which keeps the
// slug): null when no visible post has it, otherwise its translation's slug, or null inside the
// result when that post has no visible translation in this locale.
export async function findPostTranslation(slug: string, locale: Locale): Promise<{ slug: string | null } | null> {
  const sources = await db.post.findMany({ where: { ...visible(), slug }, select: { translationKey: true } });
  if (sources.length === 0) return null;
  const translation = await db.post.findFirst({
    where: { ...visible(locale), translationKey: { in: sources.map((source) => source.translationKey) } },
    select: { slug: true },
  });
  return { slug: translation?.slug ?? null };
}

export async function listCategories(locale: Locale) {
  const categories = await db.category.findMany({
    where: { locale, posts: { some: visible(locale) } },
    select: { id: true, name: true, slug: true, _count: { select: { posts: { where: visible(locale) } } } },
    orderBy: { name: "asc" },
  });
  return categories.map(({ _count, ...category }) => ({ ...category, postCount: _count.posts }));
}

// Categories exist publicly only while they hold a visible post, like in listCategories.
export async function getCategory(locale: Locale, slug: string) {
  return db.category.findFirst({ where: { locale, slug, posts: { some: visible(locale) } } });
}

export async function findCategoryTranslation(slug: string, locale: Locale): Promise<string | null> {
  const sources = await db.category.findMany({
    where: { slug, posts: { some: visible() } },
    select: { translationKey: true },
  });
  if (sources.length === 0) return null;
  const translation = await db.category.findFirst({
    where: {
      locale,
      translationKey: { in: sources.map((source) => source.translationKey) },
      posts: { some: visible(locale) },
    },
    select: { slug: true },
  });
  return translation?.slug ?? null;
}

// Slug of every visible language version of a post or category, for hreflang links and the sitemap.
export async function postTranslations(translationKey: string): Promise<Partial<Record<Locale, string>>> {
  const rows = await db.post.findMany({ where: { ...visible(), translationKey }, select: { locale: true, slug: true } });
  return Object.fromEntries(rows.map((row) => [row.locale, row.slug]));
}

export async function categoryTranslations(translationKey: string): Promise<Partial<Record<Locale, string>>> {
  const rows = await db.category.findMany({
    where: { translationKey, posts: { some: visible() } },
    select: { locale: true, slug: true },
  });
  return Object.fromEntries(rows.map((row) => [row.locale, row.slug]));
}

// Every visible post and every category with a visible post, for the sitemap.
export async function sitemapBlogEntries() {
  const [posts, categories] = await Promise.all([
    db.post.findMany({ where: visible(), select: { locale: true, slug: true, translationKey: true, updatedAt: true } }),
    db.category.findMany({
      where: { posts: { some: visible() } },
      select: { locale: true, slug: true, translationKey: true },
    }),
  ]);
  return { posts, categories };
}
