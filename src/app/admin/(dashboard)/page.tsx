import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Inicio" };

export default async function AdminHomePage() {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  await requireSession();
  const [contacts, unread] = await Promise.all([
    db.contactSubmission.count(),
    db.contactSubmission.count({ where: { readAt: null } }),
  ]);

  const stats = [
    { label: "Mensajes de contacto", value: contacts },
    { label: "Mensajes sin leer", value: unread },
  ];

  return (
    <>
      <h1 className="text-headline text-ink">Inicio</h1>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border border-line bg-white p-5">
            <dt className="text-sm text-graphite">{stat.label}</dt>
            <dd className="mt-1 text-3xl font-semibold text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
