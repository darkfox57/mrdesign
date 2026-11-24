import type { Metadata } from "next";
import Link from "next/link";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LANDINGS_ADMIN_PATH, hasLandingDraft } from "@/lib/admin/landing-create";
import { LOCALE_IN_SENTENCE, LOCALE_LABELS, STATUS_LABELS } from "@/lib/admin/posts";
import { requirePermission } from "@/lib/auth/require-permission";
import { db } from "@/lib/db";
import { landingHref } from "@/lib/landings/routes";
import { LandingPublishButton } from "./LandingPublishButton";

export const metadata: Metadata = { title: "Landings" };

export default async function LandingsPage() {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  await requirePermission("content", ["read"]);
  const landings = await db.landing.findMany({
    orderBy: [{ translationKey: "asc" }, { locale: "asc" }],
    select: { id: true, title: true, slug: true, locale: true, status: true, translationKey: true, draftBlocks: true },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-headline text-ink">Landings</h1>
        <Link
          href={`${LANDINGS_ADMIN_PATH}/nueva`}
          className="inline-flex min-h-11 items-center rounded-control bg-brand-600 px-5 font-medium text-white hover:bg-brand-700"
        >
          Nueva landing
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-graphite">
        Páginas de venta armadas con el editor visual. Lo que guardes queda como borrador; el sitio muestra lo que publiques.
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-line text-graphite">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Título</th>
              <th scope="col" className="px-4 py-3 font-medium">Idioma</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
              <th scope="col" className="px-4 py-3 font-medium">Traducciones</th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {landings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-graphite">
                  No hay landings. Crea la primera con «Nueva landing».
                </td>
              </tr>
            ) : null}
            {landings.map((landing) => {
              const published = landing.status === "PUBLISHED";
              const publicPath = getPathname({ locale: landing.locale, href: landingHref(landing.slug) });
              const missing = routing.locales.filter(
                (locale) =>
                  locale !== landing.locale &&
                  !landings.some((other) => other.translationKey === landing.translationKey && other.locale === locale),
              );
              return (
                <tr key={landing.id} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`${LANDINGS_ADMIN_PATH}/${landing.id}/visual`}
                      aria-label={`Editar ${landing.title}`}
                      className="font-medium text-ink underline-offset-2 hover:text-brand-700 hover:underline"
                    >
                      {landing.title}
                    </Link>
                    <span className="mt-1 block text-xs text-graphite">{publicPath}</span>
                    {published ? (
                      <Link href={publicPath} target="_blank" className="mt-1 block text-xs text-brand-700 underline underline-offset-2">
                        Ver en el sitio
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink">{LOCALE_LABELS[landing.locale]}</td>
                  <td className="px-4 py-3">
                    <span className={published ? "font-medium text-ink" : "text-graphite"}>{STATUS_LABELS[landing.status]}</span>
                    {hasLandingDraft(landing) ? <span className="mt-1 block text-xs text-graphite">Con borrador sin publicar</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    {missing.length === 0 ? (
                      <span className="text-graphite">Completas</span>
                    ) : (
                      <ul className="grid gap-1">
                        {missing.map((locale) => (
                          <li key={locale}>
                            <Link
                              href={`${LANDINGS_ADMIN_PATH}/nueva?traducir=${landing.id}&idioma=${locale}`}
                              aria-label={`Traducir ${landing.title} al ${LOCALE_IN_SENTENCE[locale]}`}
                              className="inline-flex min-h-11 items-center text-brand-700 underline underline-offset-2"
                            >
                              Traducir al {LOCALE_IN_SENTENCE[locale]}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {landing.status === "ARCHIVED" ? null : (
                      <LandingPublishButton landingId={landing.id} title={landing.title} published={published} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
