"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePostForm, postIdsSchema, type PostFormField, type PostFormInput } from "@/lib/admin/post-form";
import { BLOG_ADMIN_PATH, publicBlogPaths } from "@/lib/admin/posts";
import { requirePermission } from "@/lib/auth/require-permission";
import { isUniqueViolation, violatesUnique } from "@/lib/blog/unique-violation";
import { db } from "@/lib/db";
import { coverPrefixes } from "@/lib/media/cover-prefixes";
import { listMedia } from "@/lib/media/library";

export type SavePostState = {
  ok?: string;
  error?: string;
  fieldErrors?: Partial<Record<PostFormField, string>>;
  values?: PostFormInput;
};

const SLUG_TAKEN = "Ya hay un post con ese slug en este idioma.";
const TRANSLATION_TAKEN = "Este post ya tiene versión en ese idioma.";
const UNIQUE_CLASH = "No se pudo guardar: otro registro ya usa alguno de estos datos. Revisa el formulario y vuelve a intentarlo.";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

function readForm(formData: FormData): PostFormInput {
  return {
    locale: text(formData, "locale"),
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    excerpt: text(formData, "excerpt"),
    content: text(formData, "content"),
    coverImageUrl: text(formData, "coverImageUrl"),
    coverImageAlt: text(formData, "coverImageAlt"),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    categoryIds: formData.getAll("categoryIds").filter((value): value is string => typeof value === "string"),
  };
}

// Creates a post (as a draft) or updates one. Needs `content: write`.
export async function savePost(_: SavePostState, formData: FormData): Promise<SavePostState> {
  await requirePermission("content", ["write"]);
  const values = readForm(formData);
  const ids = postIdsSchema.safeParse({ postId: formData.get("postId") ?? "", translationOf: formData.get("translationOf") ?? "" });
  if (!ids.success) return { error: "Acción no válida.", values };
  const { postId } = ids.data;

  const existing = postId ? await db.post.findUnique({ where: { id: postId }, select: { locale: true } }) : null;
  if (postId && !existing) return { error: "El post ya no existe.", values };
  // A post keeps its language: translations are separate posts linked by translationKey.
  if (existing) values.locale = existing.locale;

  const parsed = parsePostForm(values, { coverPrefixes: coverPrefixes() });
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };
  const { categoryIds, ...data } = parsed.data;

  // A new translation shares the original's translationKey; only one version per language.
  const translationOf = postId ? null : ids.data.translationOf;
  let translationKey: string | undefined;
  if (translationOf) {
    const source = await db.post.findUnique({ where: { id: translationOf }, select: { locale: true, translationKey: true } });
    if (!source) return { error: "El post original ya no existe.", values };
    if (source.locale === data.locale) return { error: "La traducción tiene que estar en otro idioma.", values };
    const sibling = await db.post.findUnique({
      where: { translationKey_locale: { translationKey: source.translationKey, locale: data.locale } },
      select: { id: true },
    });
    if (sibling) return { error: TRANSLATION_TAKEN, values };
    translationKey = source.translationKey;
  }

  const taken = await db.post.findFirst({
    where: { locale: data.locale, slug: data.slug, ...(postId ? { NOT: { id: postId } } : {}) },
    select: { id: true },
  });
  if (taken) return { fieldErrors: { slug: SLUG_TAKEN }, values };

  // Only categories of the post's language count; anything else in the form is ignored.
  const categories = await db.category.findMany({ where: { id: { in: categoryIds }, locale: data.locale }, select: { id: true } });

  let savedId: string;
  try {
    if (postId) {
      await db.post.update({ where: { id: postId }, data: { ...data, categories: { set: categories } } });
      savedId = postId;
    } else {
      const created = await db.post.create({
        data: { ...data, ...(translationKey ? { translationKey } : {}), status: "DRAFT", source: "MANUAL", categories: { connect: categories } },
      });
      savedId = created.id;
    }
  } catch (error) {
    // Another save took the slug, or the translation slot, between the check and the write.
    if (violatesUnique(error, "Post", ["translationKey", "locale"])) return { error: TRANSLATION_TAKEN, values };
    if (violatesUnique(error, "Post", ["locale", "slug"])) return { fieldErrors: { slug: SLUG_TAKEN }, values };
    // Any other unique index: still a clash with stored data, not a crash. The editor keeps what was typed.
    if (isUniqueViolation(error)) return { error: UNIQUE_CLASH, values };
    throw error;
  }

  revalidatePath(BLOG_ADMIN_PATH, "layout");
  // A new post is a draft; an edit may change a published post (its slug included).
  if (!postId) redirect(`${BLOG_ADMIN_PATH}/${savedId}`);
  for (const path of publicBlogPaths()) revalidatePath(path, "layout");
  return { ok: "Guardado." };
}

export type PickerMedia = { id: string; url: string; alt: string; originalName: string };

// Reads the image library for the cover and content pickers (`media: read`).
export async function listPickerMedia(page: number): Promise<{ items: PickerMedia[]; pages: number }> {
  await requirePermission("media", ["read"]);
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const { items, pages } = await listMedia({ page: safePage, pageSize: 24 });
  return { items: items.map(({ id, url, alt, originalName }) => ({ id, url, alt, originalName })), pages };
}
