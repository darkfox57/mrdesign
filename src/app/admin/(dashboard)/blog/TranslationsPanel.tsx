import Link from "next/link";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_IN_SENTENCE, STATUS_LABELS, type PostStatus } from "@/lib/admin/posts";
import { db } from "@/lib/db";

const link = "font-medium text-brand-700 underline underline-offset-2";

type Sibling = { id: string; locale: Locale; status: PostStatus };

// Versions of a post in the other languages, linked by translationKey (the same key the public
// blog uses for its language switcher and hreflang).
export async function TranslationsPanel({ post }: { post: { id: string; locale: Locale; translationKey: string } }) {
  const siblings = await db.post.findMany({
    where: { translationKey: post.translationKey, NOT: { id: post.id } },
    select: { id: true, locale: true, status: true },
  });
  return <TranslationsList item={post} siblings={siblings} basePath="/admin/blog" />;
}

// The panel itself, for any module whose rows are translated by translationKey: links to edit each
// version, or to create the missing one at `<basePath>/nuevo?traducir=<id>&idioma=<locale>`.
export function TranslationsList({ item, siblings, basePath }: { item: { id: string; locale: Locale }; siblings: Sibling[]; basePath: string }) {
  return (
    <section aria-labelledby="translations-title" className="rounded-card border border-line bg-surface p-4">
      <h2 id="translations-title" className="text-sm font-semibold text-ink">
        Traducciones
      </h2>
      <ul className="mt-2 grid gap-2 text-sm">
        {routing.locales
          .filter((locale) => locale !== item.locale)
          .map((locale) => {
            const sibling = siblings.find((candidate) => candidate.locale === locale);
            return (
              <li key={locale}>
                {sibling ? (
                  <>
                    <Link href={`${basePath}/${sibling.id}`} className={link}>
                      Editar la versión en {LOCALE_IN_SENTENCE[locale]}
                    </Link>{" "}
                    <span className="text-graphite">({STATUS_LABELS[sibling.status].toLowerCase()})</span>
                  </>
                ) : (
                  <Link href={`${basePath}/nuevo?traducir=${item.id}&idioma=${locale}`} className={link}>
                    Traducir al {LOCALE_IN_SENTENCE[locale]}
                  </Link>
                )}
              </li>
            );
          })}
      </ul>
    </section>
  );
}
