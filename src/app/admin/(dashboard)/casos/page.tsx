import type { Metadata } from "next";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { CASES_ADMIN_PATH, caseName, listCases } from "@/lib/admin/cases";
import { LOCALE_LABELS, POST_STATUSES, STATUS_LABELS, postListFilterSchema } from "@/lib/admin/posts";
import { requirePermission } from "@/lib/auth/require-permission";
import { PublishButton } from "../blog/PublishButton";
import { setCasePublicationAction } from "./actions";

export const metadata: Metadata = { title: "Casos" };

const control = "min-h-11 rounded-control border border-field bg-surface px-3 text-sm";

export default async function AdminCasesPage({ searchParams }: PageProps<"/admin/casos">) {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  await requirePermission("content", ["read"]);
  const raw = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  // Same filters as the blog list: status, language and page, from the URL.
  const filter = postListFilterSchema.parse({ status: one(raw.status), locale: one(raw.locale), page: one(raw.page) });
  const { items, total, pages, page } = await listCases(filter);
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.locale) params.set("locale", filter.locale);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return `${CASES_ADMIN_PATH}${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-headline text-ink">Casos</h1>
        <Link href={`${CASES_ADMIN_PATH}/nuevo`} className="inline-flex min-h-11 items-center rounded-control bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
          Nuevo caso
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-graphite">
        Los casos de éxito del portafolio, en español y en inglés. Un caso se publica solo cuando está completo y el cliente autorizó mostrarlo.
      </p>

      {/* A plain GET form: the filters live in the URL and work without JavaScript. */}
      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Estado
          <select name="status" defaultValue={filter.status ?? ""} className={control}>
            <option value="">Todos</option>
            {POST_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Idioma
          <select name="locale" defaultValue={filter.locale ?? ""} className={control}>
            <option value="">Todos</option>
            {routing.locales.map((locale) => (
              <option key={locale} value={locale}>
                {LOCALE_LABELS[locale]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-ink">
          Filtrar
        </button>
        <p className="ml-auto text-sm text-graphite">{total === 1 ? "1 caso" : `${total} casos`}</p>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-line text-graphite">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Caso</th>
              <th scope="col" className="px-4 py-3 font-medium">Cliente</th>
              <th scope="col" className="px-4 py-3 font-medium">Idioma</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
              <th scope="col" className="px-4 py-3 font-medium">Autorización</th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-graphite">
                  {total === 0 && !filter.status && !filter.locale ? "Todavía no hay casos." : "No hay casos con estos filtros."}
                </td>
              </tr>
            ) : null}
            {items.map((item) => {
              const published = item.status === "PUBLISHED";
              const name = caseName(item);
              return (
                <tr key={item.id} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`${CASES_ADMIN_PATH}/${item.id}`}
                      aria-label={`Editar ${name}`}
                      className="font-medium text-ink underline-offset-2 hover:text-brand-700 hover:underline"
                    >
                      {name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink">{item.client || "—"}</td>
                  <td className="px-4 py-3 text-ink">{LOCALE_LABELS[item.locale]}</td>
                  <td className="px-4 py-3">
                    <span className={published ? "font-medium text-ink" : "text-graphite"}>{STATUS_LABELS[item.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-graphite">{item.clientAuthorized ? "Autorizado" : "Sin autorizar"}</td>
                  <td className="px-4 py-3">
                    {item.status === "ARCHIVED" ? null : (
                      <PublishButton postId={item.id} idField="caseId" title={name} published={published} action={setCasePublicationAction} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <nav aria-label="Páginas" className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="inline-flex min-h-11 items-center font-medium text-brand-700 underline underline-offset-2">
              Anterior
            </Link>
          ) : null}
          <span className="text-graphite">
            Página {page} de {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="inline-flex min-h-11 items-center font-medium text-brand-700 underline underline-offset-2">
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
