import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { parsePostForm, type PostFormField } from "@/lib/admin/post-form";
import { publicBlogPaths } from "@/lib/admin/posts";
import { hashApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { coverPrefixes } from "@/lib/media/cover-prefixes";
import { siteUrl } from "@/lib/seo/site";
import { slugify } from "@/lib/slugify";
import { isUniqueViolation, violatesUnique } from "./unique-violation";

// Body of POST /api/blog (contract in docs/api-blog.md). A field of the wrong JSON type is named
// like any other invalid field.
const termName = z.string().trim().min(1).max(60);
const text = () => z.string("Tiene que ser texto.").optional();
const bodySchema = z.object(
  {
    title: text(),
    slug: text(),
    img: text(),
    imgAlt: text(),
    description: text(),
    content: text(),
    locale: text(),
    seoTitle: text(),
    seoDescription: text(),
    // "a, b" or ["a", "b"].
    tags: z.union([z.string(), z.array(z.string())], "Usa texto separado por comas o una lista de textos.").optional(),
    // Names, or { name }.
    categories: z.array(z.unknown(), "Usa una lista de nombres.").optional(),
  },
  "El cuerpo tiene que ser un objeto JSON.",
);

// Limits published in docs/api-blog.md, counted after duplicates are merged.
const MAX_CATEGORIES = 10;
const MAX_TAGS = 20;

// Errors use the API's field names, not the editor's.
const FIELD_NAMES: Partial<Record<PostFormField, string>> = {
  excerpt: "description",
  coverImageUrl: "img",
  coverImageAlt: "imgAlt",
};
const INVALID = "Datos inválidos.";
const COVER_OUTSIDE_LIBRARY = "La portada tiene que estar en la biblioteca de imágenes del panel.";
const SLUG_TAKEN = "Ya existe un post con ese slug en este idioma.";
const UNIQUE_CLASH = "Otro registro ya usa alguno de estos datos. Revisa el post y vuelve a intentarlo.";

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

type Terms = { terms: { slug: string; name: string }[]; error?: undefined } | { error: string };

// Tags or categories, deduplicated by slug. An entry it cannot use, or more than `max`, is an error
// for the client to fix: nothing is dropped or cut silently. In "a, b" form an empty piece (a
// trailing comma) is not an entry.
function terms(raw: unknown[] | string | string[] | undefined, max: number, messages: { invalid: string; tooMany: string }): Terms {
  const list = typeof raw === "string" ? raw.split(",").filter((piece) => piece.trim()) : (raw ?? []);
  const bySlug = new Map<string, string>();
  for (const entry of list) {
    const name = termName.safeParse(typeof entry === "object" && entry && "name" in entry ? entry.name : entry);
    const slug = name.success ? slugify(name.data) : "";
    if (!name.success || !slug) return { error: messages.invalid };
    if (!bySlug.has(slug)) bySlug.set(slug, name.data);
  }
  if (bySlug.size > max) return { error: messages.tooMany };
  return { terms: [...bySlug].map(([slug, name]) => ({ slug, name })) };
}

const slugTaken = (locale: Locale, slug: string) => db.post.count({ where: { locale, slug } }).then((count) => count > 0);
const invalid = (fields: Record<string, string>): IngestResult => ({ status: 400, body: { error: INVALID, fields } });
const slugError = () => invalid({ slug: SLUG_TAKEN });

// `key` comes from authenticateKey: the route authenticates before it reads the body.
export async function ingestPost(key: IngestKey, raw: unknown): Promise<IngestResult> {
  const shape = bodySchema.safeParse(raw);
  if (!shape.success) {
    const fields: Record<string, string> = {};
    for (const issue of shape.error.issues) fields[String(issue.path[0] ?? "body")] ??= issue.message;
    return invalid(fields);
  }
  const body = shape.data;
  const categories = terms(body.categories, MAX_CATEGORIES, {
    invalid: "Cada categoría necesita un nombre con letras o números, de hasta 60 caracteres.",
    tooMany: `Máximo ${MAX_CATEGORIES} categorías.`,
  });
  const tags = terms(body.tags, MAX_TAGS, {
    invalid: "Cada etiqueta necesita un nombre con letras o números, de hasta 60 caracteres.",
    tooMany: `Máximo ${MAX_TAGS} etiquetas.`,
  });

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
    { coverPrefixes: coverPrefixes(), coverOutsideLibrary: COVER_OUTSIDE_LIBRARY },
  );
  const fields: Record<string, string> = parsed.success
    ? {}
    : Object.fromEntries(Object.entries(parsed.fieldErrors).map(([field, message]) => [FIELD_NAMES[field as PostFormField] ?? field, message]));
  if (tags.error !== undefined) fields.tags = tags.error;
  if (categories.error !== undefined) fields.categories = categories.error;
  if (!parsed.success || tags.error !== undefined || categories.error !== undefined) return invalid(fields);

  const { locale, slug, title, excerpt, content, coverImageUrl, coverImageAlt, seoTitle, seoDescription } = parsed.data;
  // A slug is never renamed behind the client's back: a clash is an error it can act on.
  if (await slugTaken(locale, slug)) return slugError();

  const publish = key.publishImmediately;

  let post;
  try {
    post = await db.$transaction(async (tx) => {
      // A term matches an existing one by slug or by name: both are unique per language, and an
      // editor may have given an existing term a custom slug.
      const categoryRows = await Promise.all(
        categories.terms.map(
          async (term) =>
            (await tx.category.findFirst({ where: { locale, OR: [{ slug: term.slug }, { name: term.name }] }, select: { id: true } })) ??
            tx.category.create({ data: { locale, ...term }, select: { id: true } }),
        ),
      );
      const tagRows = await Promise.all(
        tags.terms.map(
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
    // Another request took the slug, or created one of the same new terms, between the check and
    // the insert. The whole transaction rolled back, so the client can simply retry.
    if (violatesUnique(error, "Post", ["locale", "slug"])) return slugError();
    if (violatesUnique(error, "Tag")) return invalid({ tags: "Otra petición creó las mismas etiquetas a la vez. Vuelve a intentarlo." });
    if (violatesUnique(error, "Category")) return invalid({ categories: "Otra petición creó las mismas categorías a la vez. Vuelve a intentarlo." });
    // A unique index none of the above knows (a new one, or a driver that reports it differently)
    // is still the client's data clashing with a stored row: a 400, never a 500.
    if (isUniqueViolation(error)) return { status: 400, body: { error: UNIQUE_CLASH } };
    throw error;
  }

  // Bookkeeping only: the post is already created, so a failure here must not turn the 201 into a 500.
  await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch((error: unknown) => {
    console.error("api/blog: could not record lastUsedAt", error);
  });
  // The same paths the dashboard revalidates after a save or a publish.
  for (const blogPath of publicBlogPaths()) revalidatePath(blogPath, "layout");

  const path = getPathname({ locale: post.locale, href: { pathname: "/blog/[slug]", params: { slug: post.slug } } });
  return {
    status: 201,
    body: { id: post.id, slug: post.slug, locale: post.locale, status: publish ? "PUBLISHED" : "DRAFT", url: `${siteUrl}${path}` },
  };
}
