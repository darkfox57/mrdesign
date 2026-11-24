import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { parsePostForm, type PostFormField } from "@/lib/admin/post-form";
import { hashApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { coverPrefixes } from "@/lib/media/cover-prefixes";
import { siteUrl } from "@/lib/seo/site";
import { slugify } from "@/lib/slugify";

// Body of POST /api/blog (contract in docs/api-blog.md).
const termName = z.string().trim().min(1).max(60);
const bodySchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  img: z.string().optional(),
  imgAlt: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  locale: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  // "a, b" or ["a", "b"].
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  // Names, or { name }.
  categories: z.array(z.unknown()).optional(),
});

// Errors use the API's field names, not the editor's.
const FIELD_NAMES: Partial<Record<PostFormField, string>> = {
  excerpt: "description",
  coverImageUrl: "img",
  coverImageAlt: "imgAlt",
};
const INVALID = "Datos inválidos.";
const EDITOR_COVER_ERROR = "Elige la portada desde la biblioteca de imágenes.";
const COVER_OUTSIDE_LIBRARY = "La portada tiene que estar en la biblioteca de imágenes del panel.";
const SLUG_TAKEN = "Ya existe un post con ese slug en este idioma.";

export type IngestResult =
  | { status: 201; body: { id: string; slug: string; locale: Locale; status: "PUBLISHED" | "DRAFT"; url: string } }
  | { status: 400; body: { error: string; fields?: Record<string, string> } };

// The key behind a bearer token, looked up by its SHA-256. A revoked or unknown key gives null.
export async function authenticateKey(token: string | null) {
  if (!token) return null;
  const key = await db.apiKey.findUnique({ where: { keyHash: hashApiKey(token) }, select: { id: true, revokedAt: true, publishImmediately: true } });
  return key && !key.revokedAt ? key : null;
}

export type IngestKey = NonNullable<Awaited<ReturnType<typeof authenticateKey>>>;

function terms(raw: unknown[] | string | string[] | undefined, max: number) {
  const list = typeof raw === "string" ? raw.split(",") : (raw ?? []);
  const names = list
    .map((entry) => (typeof entry === "string" ? entry : typeof entry === "object" && entry && "name" in entry ? (entry as { name: unknown }).name : null))
    .map((name) => termName.safeParse(name))
    .flatMap((parsed) => (parsed.success ? [parsed.data] : []));
  const bySlug = new Map<string, string>();
  for (const name of names) {
    const slug = slugify(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name);
  }
  return [...bySlug].slice(0, max).map(([slug, name]) => ({ slug, name }));
}

const slugTaken = (locale: Locale, slug: string) => db.post.count({ where: { locale, slug } }).then((count) => count > 0);
const slugError = (): IngestResult => ({ status: 400, body: { error: INVALID, fields: { slug: SLUG_TAKEN } } });

// Public pages that list or show the post. The proxy rewrites unprefixed Spanish URLs to
// /es/..., and revalidatePath needs that destination path, so the locale prefix is forced.
function revalidateBlog(locale: Locale, slug: string) {
  for (const each of routing.locales) revalidatePath(getPathname({ locale: each, href: "/blog", forcePrefix: true }));
  revalidatePath(getPathname({ locale, href: { pathname: "/blog/[slug]", params: { slug } }, forcePrefix: true }));
}

// `key` comes from authenticateKey: the route authenticates before it reads the body.
export async function ingestPost(key: IngestKey, raw: unknown): Promise<IngestResult> {
  const shape = bodySchema.safeParse(raw);
  if (!shape.success) return { status: 400, body: { error: INVALID, fields: { body: "El cuerpo tiene que ser un objeto JSON." } } };
  const body = shape.data;

  // Same validation and sanitizing as the dashboard editor.
  const parsed = parsePostForm(
    {
      locale: body.locale ?? "es",
      title: body.title ?? "",
      slug: body.slug ?? "",
      excerpt: body.description ?? "",
      content: body.content ?? "",
      coverImageUrl: body.img ?? "",
      coverImageAlt: body.imgAlt ?? "",
      seoTitle: body.seoTitle ?? "",
      seoDescription: body.seoDescription ?? "",
      categoryIds: [],
    },
    { coverPrefixes: coverPrefixes() },
  );
  if (!parsed.success) {
    const fields = Object.fromEntries(
      Object.entries(parsed.fieldErrors).map(([field, message]) => [
        FIELD_NAMES[field as PostFormField] ?? field,
        field === "coverImageUrl" && message === EDITOR_COVER_ERROR ? COVER_OUTSIDE_LIBRARY : message,
      ]),
    );
    return { status: 400, body: { error: INVALID, fields } };
  }

  const { locale, slug, title, excerpt, content, coverImageUrl, coverImageAlt, seoTitle, seoDescription } = parsed.data;
  // A slug is never renamed behind the client's back: a clash is an error it can act on.
  if (await slugTaken(locale, slug)) return slugError();

  const categories = terms(body.categories, 10);
  const tags = terms(body.tags, 20);
  const publish = key.publishImmediately;

  let post;
  try {
    post = await db.$transaction(async (tx) => {
      // A term matches an existing one by slug or by name: both are unique per language, and an
      // editor may have given an existing term a custom slug.
      const categoryRows = await Promise.all(
        categories.map(
          async (term) =>
            (await tx.category.findFirst({ where: { locale, OR: [{ slug: term.slug }, { name: term.name }] }, select: { id: true } })) ??
            tx.category.create({ data: { locale, ...term }, select: { id: true } }),
        ),
      );
      const tagRows = await Promise.all(
        tags.map(
          async (term) =>
            (await tx.tag.findFirst({ where: { locale, OR: [{ slug: term.slug }, { name: term.name }] }, select: { id: true } })) ??
            tx.tag.create({ data: { locale, ...term }, select: { id: true } }),
        ),
      );
      return tx.post.create({
        data: {
          locale,
          slug,
          title,
          excerpt,
          content,
          coverImageUrl,
          coverImageAlt,
          seoTitle,
          seoDescription,
          source: "API",
          status: publish ? "PUBLISHED" : "DRAFT",
          publishedAt: publish ? new Date() : null,
          categories: { connect: categoryRows },
          tags: { connect: tagRows },
        },
        select: { id: true, slug: true, locale: true, status: true },
      });
    });
  } catch (error) {
    // Another request took the slug between the check and the insert.
    const clash = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (clash && (await slugTaken(locale, slug))) return slugError();
    throw error;
  }

  // Bookkeeping only: the post is already created, so a failure here must not turn the 201 into a 500.
  await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch((error: unknown) => {
    console.error("api/blog: could not record lastUsedAt", error);
  });
  revalidateBlog(post.locale, post.slug);

  const path = getPathname({ locale: post.locale, href: { pathname: "/blog/[slug]", params: { slug: post.slug } } });
  return {
    status: 201,
    body: { id: post.id, slug: post.slug, locale: post.locale, status: post.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT", url: `${siteUrl}${path}` },
  };
}
