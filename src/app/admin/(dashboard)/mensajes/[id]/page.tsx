import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { INBOX_PATH, LOCALE_LABELS, projectTypeLabel, replyHref } from "@/lib/admin/messages";
import { DeleteMessage, ReadToggle } from "../MessageActions";

export const metadata: Metadata = { title: "Mensaje" };

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short" });

export default async function MessagePage({ params }: PageProps<"/admin/mensajes/[id]">) {
  // Admins only. The page checks the session itself: the layout's check does not stop it from rendering.
  await requireSession(["admin"]);
  const { id } = await params;
  const message = await db.contactSubmission.findUnique({ where: { id } });
  if (!message) notFound();

  const details = [
    { label: "Email", value: message.email },
    { label: "Teléfono", value: message.phone },
    { label: "Empresa", value: message.company },
    { label: "Tipo de proyecto", value: projectTypeLabel(message.projectType) },
    { label: "Idioma del sitio", value: LOCALE_LABELS[message.locale] },
    { label: "Recibido", value: dateFormat.format(message.createdAt) },
    { label: "Aceptó la política de privacidad", value: message.consent ? "Sí" : "No" },
  ];

  return (
    <>
      <Link href={INBOX_PATH} className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 underline underline-offset-2">
        Volver a los mensajes
      </Link>
      <h1 className="mt-2 text-headline break-words text-ink">{message.name}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section aria-label="Mensaje" className="rounded-card border border-line bg-surface p-5">
          <p className="whitespace-pre-line break-words text-ink">{message.message}</p>
        </section>
        <aside className="grid content-start gap-4">
          <dl className="grid gap-3 rounded-card border border-line bg-surface p-5 text-sm">
            {details
              .filter((detail) => detail.value)
              .map((detail) => (
                <div key={detail.label}>
                  <dt className="text-graphite">{detail.label}</dt>
                  <dd className="break-all text-ink">{detail.value}</dd>
                </div>
              ))}
          </dl>
          <a
            href={replyHref(message.email, message.locale)}
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand-600 px-5 font-medium text-white hover:bg-brand-700"
          >
            Responder por email
          </a>
          <ReadToggle messageId={message.id} read={message.readAt !== null} />
          <DeleteMessage messageId={message.id} />
        </aside>
      </div>
    </>
  );
}
