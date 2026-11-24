import type { Metadata } from "next";
import Link from "next/link";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_IN_SENTENCE, LOCALE_LABELS } from "@/lib/admin/posts";
import { requirePermission } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { PostForm } from "../PostForm";

export const metadata: Metadata = { title: "Nuevo post" };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const isLocale = (value: string | undefined): value is Locale => routing.locales.includes(value as Locale);

const empty = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  coverImageAlt: "",
  seoTitle: "",
  seoDescription: "",
  categoryIds: [] as string[],
};

export default async function NewPostPage({ searchParams }: PageProps<"/admin/blog/nuevo">) {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  await requirePermission("content", ["write"]);
  const params = await searchParams;
  const sourceId = one(params.traducir);
  const targetLocale = one(params.idioma);

  // ?traducir=<post id>&idioma=<locale>: a new version of that post in another language.
  const source =
    sourceId && isLocale(targetLocale)
      ? await db.post.findUnique({
          where: { id: sourceId },
          select: { id: true, title: true, locale: true, translationKey: true, coverImageUrl: true, coverImageAlt: true },
        })
      : null;
  const translation = source && isLocale(targetLocale) && source.locale !== targetLocale ? { source, locale: targetLocale } : null;
  const existing = translation
    ? await db.post.findUnique({
        where: { translationKey_locale: { translationKey: translation.source.translationKey, locale: translation.locale } },
        select: { id: true },
      })
    : null;
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, locale: true } });

  return (
    <>
      <Link
        href={translation ? `/admin/blog/${translation.source.id}` : "/admin/blog"}
        className="text-sm font-medium text-brand-700 underline underline-offset-2"
      >
        {translation ? "Volver al post original" : "Volver al blog"}
      </Link>
      <h1 className="mt-2 text-headline text-ink">{translation ? "Nueva traducción" : "Nuevo post"}</h1>
      {translation ? (
        <p className="mt-2 text-graphite">
          Traducción de «{translation.source.title}» ({LOCALE_LABELS[translation.source.locale]}) al {LOCALE_IN_SENTENCE[translation.locale]}.
        </p>
      ) : (
        <p className="mt-2 text-graphite">Se guarda como borrador. Lo publicas desde el listado o desde esta misma pantalla después de guardar.</p>
      )}

      {translation && existing ? (
        <div className="mt-6 rounded-card border border-line bg-surface p-5">
          <p className="text-ink">Este post ya tiene versión en {LOCALE_IN_SENTENCE[translation.locale]}.</p>
          <Link href={`/admin/blog/${existing.id}`} className="mt-2 inline-block font-medium text-brand-700 underline underline-offset-2">
            Editar la versión en {LOCALE_IN_SENTENCE[translation.locale]}
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <PostForm
            categories={categories}
            translationOf={translation?.source.id}
            initial={
              translation
                ? {
                    ...empty,
                    locale: translation.locale,
                    // The cover usually works in every language; the text is written again.
                    coverImageUrl: translation.source.coverImageUrl ?? "",
                    coverImageAlt: translation.source.coverImageAlt ?? "",
                  }
                : { ...empty, locale: "es" }
            }
          />
        </div>
      )}
    </>
  );
}
