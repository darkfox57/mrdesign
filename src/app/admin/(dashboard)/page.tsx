import type { Metadata } from "next";
import Link from "next/link";
import { INBOX_PATH, canReadInbox } from "@/lib/admin/messages";
import { BLOG_ADMIN_PATH } from "@/lib/admin/posts";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Inicio" };

// Contact messages are personal data: only roles that can read the inbox get the counts.
async function inboxStats() {
  const [contacts, unread] = await Promise.all([
    db.contactSubmission.count(),
    db.contactSubmission.count({ where: { readAt: null } }),
  ]);
  return [
    { label: "Mensajes de contacto", value: contacts },
    { label: "Mensajes sin leer", value: unread },
  ];
}

// Every dashboard role works on the blog, so everyone gets these.
async function postStats() {
  const [drafts, published] = await Promise.all([
    db.post.count({ where: { status: "DRAFT" } }),
    db.post.count({ where: { status: "PUBLISHED" } }),
  ]);
  return [
    { label: "Posts en borrador", value: drafts },
    { label: "Posts publicados", value: published },
  ];
}

export default async function AdminHomePage() {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  const { user, role } = await requireSession();
  const [posts, stats] = await Promise.all([postStats(), canReadInbox(role) ? inboxStats() : null]);

  return (
    <>
      <h1 className="text-headline text-ink">Inicio</h1>
      <p className="mt-2 max-w-2xl text-graphite">Hola, {user.name}. Usa el menú para gestionar el sitio.</p>
      <section aria-labelledby="post-stats" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="post-stats" className="text-lg font-semibold text-ink">
            Blog
          </h2>
          <Link href={BLOG_ADMIN_PATH} className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 underline underline-offset-2">
            Ver posts
          </Link>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {posts.map((stat) => (
            <div key={stat.label} className="rounded-card border border-line bg-surface p-5">
              <dt className="text-sm text-graphite">{stat.label}</dt>
              <dd className="mt-1 text-3xl font-semibold text-ink">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {stats ? (
        <section aria-labelledby="inbox-stats" className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="inbox-stats" className="text-lg font-semibold text-ink">
              Contacto
            </h2>
            <Link href={INBOX_PATH} className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 underline underline-offset-2">
              Ver mensajes
            </Link>
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-card border border-line bg-surface p-5">
                <dt className="text-sm text-graphite">{stat.label}</dt>
                <dd className="mt-1 text-3xl font-semibold text-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </>
  );
}
