import type { Metadata } from "next";
import Link from "next/link";
import { getPathname } from "@/i18n/navigation";
import {
  ADMIN_POSTS_PER_PAGE,
  BLOG_ADMIN_PATH,
  LOCALE_LABELS,
  POST_STATUSES,
  STATUS_LABELS,
  postListFilterSchema,
} from "@/lib/admin/posts";
import { requireSession } from "@/lib/auth/session";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { PublishButton } from "./PublishButton";

export const metadata: Metadata = { title: "Blog" };

const control = "min-h-11 rounded-control border border-field bg-surface px-3 text-sm";
const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium" });

export default async function AdminBlogPage({ searchParams }: PageProps<"/admin/blog">) {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  await requireSession();
  const raw = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const filter = postListFilterSchema.parse({ status: one(raw.status), locale: one(raw.locale), page: one(raw.page) });

  const where = { ...(filter.status ? { status: filter.status } : {}), ...(filter.locale ? { locale: filter.locale } : {}) };
  const total = await db.post.count({ where });
  const pages = Math.max(1, Math.ceil(total / ADMIN_POSTS_PER_PAGE));
  // A page past the last one shows the last one.
  const page = Math.min(filter.page, pages);
  const posts = await db.post.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * ADMIN_POSTS_PER_PAGE,
    take: ADMIN_POSTS_PER_PAGE,
    select: { id: true, title: true, slug: true, locale: true, status: true, publishedAt: true },
  });
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.locale) params.set("locale", filter.locale);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return `${BLOG_ADMIN_PATH}${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-headline text-ink">Blog</h1>
        <Link href="/admin/blog/nuevo" className="inline-flex min-h-11 items-center rounded-control bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
          Nuevo post
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-graphite">
        Un post publicado aparece en el blog al momento. Al publicar se conserva la fecha original del post; si nunca tuvo una, se usa la de
        hoy.
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
        <p className="ml-auto text-sm text-graphite">{total === 1 ? "1 post" : `${total} posts`}</p>
      </form>

      <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-line text-graphite">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Título</th>
              <th scope="col" className="px-4 py-3 font-medium">Idioma</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
              <th scope="col" className="px-4 py-3 font-medium">Publicación</th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-graphite">
                  No hay posts con estos filtros.
                </td>
              </tr>
            ) : null}
            {posts.map((post) => {
              const published = post.status === "PUBLISHED";
              const publicPath = getPathname({ locale: post.locale, href: { pathname: "/blog/[slug]", params: { slug: post.slug } } });
              return (
                <tr key={post.id} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      aria-label={`Editar ${post.title}`}
                      className="font-medium text-ink underline-offset-2 hover:text-brand-700 hover:underline"
                    >
                      {post.title}
                    </Link>
                    {published ? (
                      <Link href={publicPath} target="_blank" className="mt-1 block text-xs text-brand-700 underline underline-offset-2">
                        Ver en el sitio
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink">{LOCALE_LABELS[post.locale]}</td>
                  <td className="px-4 py-3">
                    <span className={published ? "font-medium text-ink" : "text-graphite"}>{STATUS_LABELS[post.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-graphite">{post.publishedAt ? dateFormat.format(post.publishedAt) : "—"}</td>
                  <td className="px-4 py-3">
                    {post.status === "ARCHIVED" ? null : <PublishButton postId={post.id} title={post.title} published={published} />}
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
