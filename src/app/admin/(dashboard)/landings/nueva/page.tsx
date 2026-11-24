import type { Metadata } from "next";
import Link from "next/link";
import { resolveTranslationRequest } from "@/lib/admin/landing-create";
import { LOCALE_IN_SENTENCE, LOCALE_LABELS } from "@/lib/admin/posts";
import { requirePermission } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { NewLandingForm } from "../NewLandingForm";

export const metadata: Metadata = { title: "Nueva landing" };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// A new landing, or with ?traducir=<landing id>&idioma=<locale> a version of an existing one in
// another language (same translationKey, like blog translations).
export default async function NewLandingPage({ searchParams }: PageProps<"/admin/landings/nueva">) {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  await requirePermission("content", ["write"]);
  const params = await searchParams;
  // A translate link that cannot be honoured is explained, never turned into an unrelated new landing.
  const request = await resolveTranslationRequest({ traducir: one(params.traducir), idioma: one(params.idioma) }, (id) =>
    db.landing.findUnique({ where: { id }, select: { id: true, title: true, locale: true, translationKey: true } }),
  );
  const translation = request.kind === "ready" ? { source: request.source, locale: request.locale } : null;
  const existing = translation
    ? await db.landing.findUnique({
        where: { translationKey_locale: { translationKey: translation.source.translationKey, locale: translation.locale } },
        select: { id: true },
      })
    : null;

  return (
    <>
      <Link href="/admin/landings" className="text-sm font-medium text-brand-700 underline underline-offset-2">
        Volver a las landings
      </Link>
      <h1 className="mt-2 text-headline text-ink">{request.kind === "none" ? "Nueva landing" : "Nueva traducción"}</h1>
      <p className="mt-2 max-w-2xl text-graphite">
        {request.kind === "invalid"
          ? "No se puede crear esta traducción con el enlace que abriste."
          : translation
          ? `Traducción de «${translation.source.title}» (${LOCALE_LABELS[translation.source.locale]}) al ${LOCALE_IN_SENTENCE[translation.locale]}. Empieza con los mismos bloques: solo tienes que traducir los textos.`
          : "Se crea como borrador y se abre en el editor visual para armar la página. No se ve en el sitio hasta que la publiques."}
      </p>

      <div className="mt-6">
        {request.kind === "invalid" ? (
          <div role="alert" className="max-w-xl rounded-card border border-line bg-surface p-5">
            <p className="font-medium text-ink">{request.message}</p>
            <Link href="/admin/landings" className="mt-2 inline-block font-medium text-brand-700 underline underline-offset-2">
              Ir a las landings
            </Link>
          </div>
        ) : translation && existing ? (
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-ink">Esta landing ya tiene versión en {LOCALE_IN_SENTENCE[translation.locale]}.</p>
            <Link href={`/admin/landings/${existing.id}/visual`} className="mt-2 inline-block font-medium text-brand-700 underline underline-offset-2">
              Editar la versión en {LOCALE_IN_SENTENCE[translation.locale]}
            </Link>
          </div>
        ) : (
          <NewLandingForm translationOf={translation?.source.id} locale={translation?.locale} />
        )}
      </div>
    </>
  );
}
