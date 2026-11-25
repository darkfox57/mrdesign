import type { Metadata } from "next";
import Link from "next/link";
import { routing, type Locale } from "@/i18n/routing";
import { caseToFormInput, type CaseFormInput } from "@/lib/admin/case-form";
import { CASES_ADMIN_PATH, caseName } from "@/lib/admin/cases";
import { LOCALE_IN_SENTENCE, LOCALE_LABELS } from "@/lib/admin/posts";
import { requirePermission } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { CaseForm } from "../CaseForm";

export const metadata: Metadata = { title: "Nuevo caso" };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const isLocale = (value: string | undefined): value is Locale => routing.locales.includes(value as Locale);

const empty: CaseFormInput = {
  locale: "es",
  title: "",
  client: "",
  year: "",
  slug: "",
  lines: [],
  summary: "",
  challenge: "",
  solution: "",
  result: "",
  metrics: [],
  stack: "",
  websiteUrl: "",
  coverImageUrl: "",
  coverImageAlt: "",
  gallery: [],
  clientAuthorized: false,
  featured: false,
  sortOrder: "",
  seoTitle: "",
  seoDescription: "",
};

export default async function NewCasePage({ searchParams }: PageProps<"/admin/casos/nuevo">) {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  await requirePermission("content", ["write"]);
  const params = await searchParams;
  const sourceId = one(params.traducir);
  const targetLocale = one(params.idioma);

  // ?traducir=<case id>&idioma=<locale>: a new version of that case in another language.
  const source = sourceId && isLocale(targetLocale) ? await db.case.findUnique({ where: { id: sourceId } }) : null;
  const translation = source && isLocale(targetLocale) && source.locale !== targetLocale ? { source, locale: targetLocale } : null;
  const existing = translation
    ? await db.case.findUnique({
        where: { translationKey_locale: { translationKey: translation.source.translationKey, locale: translation.locale } },
        select: { id: true },
      })
    : null;

  // A translation keeps what does not depend on the language (client, year, lines, stack, site,
  // images, authorization, order); the texts, alt texts and metrics are written again.
  const initial: CaseFormInput = translation
    ? (() => {
        const copy = caseToFormInput(translation.source);
        return {
          ...empty,
          locale: translation.locale,
          client: copy.client,
          year: copy.year,
          lines: copy.lines,
          stack: copy.stack,
          websiteUrl: copy.websiteUrl,
          coverImageUrl: copy.coverImageUrl,
          gallery: copy.gallery.map(({ url }) => ({ url, alt: "" })),
          clientAuthorized: copy.clientAuthorized,
          featured: copy.featured,
          sortOrder: copy.sortOrder,
        };
      })()
    : empty;

  return (
    <>
      <Link
        href={translation ? `${CASES_ADMIN_PATH}/${translation.source.id}` : CASES_ADMIN_PATH}
        className="text-sm font-medium text-brand-700 underline underline-offset-2"
      >
        {translation ? "Volver al caso original" : "Volver a los casos"}
      </Link>
      <h1 className="mt-2 text-headline text-ink">{translation ? "Nueva traducción" : "Nuevo caso"}</h1>
      {translation ? (
        <p className="mt-2 text-graphite">
          Traducción de «{caseName(translation.source)}» ({LOCALE_LABELS[translation.source.locale]}) al {LOCALE_IN_SENTENCE[translation.locale]}.
        </p>
      ) : (
        <p className="mt-2 text-graphite">
          Puedes guardarlo como borrador con lo que tengas. Para publicarlo necesita todos sus textos, al menos una línea de trabajo, la portada y la
          autorización del cliente.
        </p>
      )}

      {translation && existing ? (
        <div className="mt-6 rounded-card border border-line bg-surface p-5">
          <p className="text-ink">Este caso ya tiene versión en {LOCALE_IN_SENTENCE[translation.locale]}.</p>
          <Link href={`${CASES_ADMIN_PATH}/${existing.id}`} className="mt-2 inline-block font-medium text-brand-700 underline underline-offset-2">
            Editar la versión en {LOCALE_IN_SENTENCE[translation.locale]}
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <CaseForm translationOf={translation?.source.id} initial={initial} />
        </div>
      )}
    </>
  );
}
