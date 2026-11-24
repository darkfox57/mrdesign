import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  INBOX_PAGE_SIZE,
  LOCALE_LABELS,
  inboxHref,
  messagePreview,
  parseInboxFilter,
  projectTypeLabel,
} from "@/lib/admin/messages";

export const metadata: Metadata = { title: "Mensajes" };

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

export default async function InboxPage({ searchParams }: PageProps<"/admin/mensajes">) {
  // Admins only. The page checks the session itself: the layout's check does not stop it from rendering.
  await requireSession(["admin"]);
  const filter = parseInboxFilter(await searchParams);
  const where = filter.unreadOnly ? { readAt: null } : {};
  const total = await db.contactSubmission.count({ where });
  const pages = Math.max(1, Math.ceil(total / INBOX_PAGE_SIZE));
  // A page past the last one shows the last one.
  const page = Math.min(filter.page, pages);

  const messages = await db.contactSubmission.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * INBOX_PAGE_SIZE,
    take: INBOX_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      projectType: true,
      locale: true,
      message: true,
      readAt: true,
      createdAt: true,
    },
  });
  const tab = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-control px-4 text-sm font-medium ${active ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-paper"}`;

  return (
    <>
      <h1 className="text-headline text-ink">Mensajes</h1>
      <p className="mt-2 max-w-2xl text-graphite">
        Lo que llega por el formulario de contacto del sitio. Son datos personales: elimina un mensaje si la persona pide borrar sus datos.
      </p>

      {filter.deleted ? (
        <p role="status" className="mt-4 rounded-control border border-line bg-surface px-4 py-3 text-sm text-success">
          Mensaje eliminado.
        </p>
      ) : null}

      <nav aria-label="Filtro" className="mt-6 flex gap-2">
        <Link href={inboxHref({ unreadOnly: false, page: 1 })} aria-current={filter.unreadOnly ? undefined : "page"} className={tab(!filter.unreadOnly)}>
          Todos
        </Link>
        <Link href={inboxHref({ unreadOnly: true, page: 1 })} aria-current={filter.unreadOnly ? "page" : undefined} className={tab(filter.unreadOnly)}>
          Sin leer
        </Link>
      </nav>

      <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-line text-graphite">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">De</th>
              <th scope="col" className="px-4 py-3 font-medium">Proyecto</th>
              <th scope="col" className="px-4 py-3 font-medium">Mensaje</th>
              <th scope="col" className="px-4 py-3 font-medium">Recibido</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-graphite">
                  {filter.unreadOnly ? "No hay mensajes sin leer." : "Todavía no llegaron mensajes."}
                </td>
              </tr>
            ) : null}
            {messages.map((message) => {
              const unread = message.readAt === null;
              return (
                <tr key={message.id} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/mensajes/${message.id}`}
                      aria-label={`Abrir el mensaje de ${message.name}`}
                      className={`underline-offset-2 hover:text-brand-700 hover:underline ${unread ? "font-semibold text-ink" : "text-ink"}`}
                    >
                      {message.name}
                    </Link>
                    <span className="block break-all text-graphite">
                      {message.company ? `${message.company} · ` : ""}
                      {message.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <span className="block">{projectTypeLabel(message.projectType)}</span>
                    <span className="block text-graphite">{LOCALE_LABELS[message.locale]}</span>
                  </td>
                  <td className="px-4 py-3 text-graphite">{messagePreview(message.message)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-graphite">{dateFormat.format(message.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={unread ? "font-medium whitespace-nowrap text-brand-700" : "whitespace-nowrap text-graphite"}>{unread ? "Sin leer" : "Leído"}</span>
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
            <Link href={inboxHref({ unreadOnly: filter.unreadOnly, page: page - 1 })} className="inline-flex min-h-11 items-center font-medium text-brand-700 underline underline-offset-2">
              Anterior
            </Link>
          ) : null}
          <span className="text-graphite">
            Página {page} de {pages}
          </span>
          {page < pages ? (
            <Link href={inboxHref({ unreadOnly: filter.unreadOnly, page: page + 1 })} className="inline-flex min-h-11 items-center font-medium text-brand-700 underline underline-offset-2">
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
