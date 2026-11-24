import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { NewKeyForm, RevokeKeyForm } from "./KeyForms";

export const metadata: Metadata = { title: "API keys" };

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

export default async function ApiKeysPage() {
  // Admins only. The page checks the session itself: the layout's check does not stop it from rendering.
  await requireSession(["admin"]);
  const keys = await db.apiKey.findMany({
    orderBy: [{ revokedAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    select: { id: true, name: true, prefix: true, publishImmediately: true, lastUsedAt: true, revokedAt: true, createdAt: true },
  });

  return (
    <>
      <h1 className="text-headline text-ink">API keys</h1>
      <p className="mt-2 max-w-2xl text-graphite">
        Permiten que otro sistema, como un generador de contenidos, cree posts con <code>POST /api/blog</code>. Cada key decide si sus posts se
        publican directo o quedan como borrador. Revoca una key si se filtró o ya no se usa.
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-line text-graphite">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Nombre</th>
              <th scope="col" className="px-4 py-3 font-medium">Empieza con</th>
              <th scope="col" className="px-4 py-3 font-medium">Posts</th>
              <th scope="col" className="px-4 py-3 font-medium">Último uso</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-graphite">
                  Todavía no hay API keys.
                </td>
              </tr>
            ) : null}
            {keys.map((key) => (
              <tr key={key.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3 font-medium text-ink">
                  {key.name}
                  <span className="block text-xs font-normal text-graphite">Creada el {dateFormat.format(key.createdAt)}</span>
                </td>
                <td className="px-4 py-3 font-mono text-ink">{key.prefix}</td>
                <td className="px-4 py-3 text-ink">{key.publishImmediately ? "Publica directo" : "Deja borradores"}</td>
                <td className="px-4 py-3 text-graphite">{key.lastUsedAt ? dateFormat.format(key.lastUsedAt) : "Nunca"}</td>
                <td className="px-4 py-3">
                  <span className={key.revokedAt ? "text-graphite" : "font-medium text-ink"}>{key.revokedAt ? "Revocada" : "Activa"}</span>
                </td>
                <td className="px-4 py-3">{key.revokedAt ? null : <RevokeKeyForm keyId={key.id} name={key.name} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <NewKeyForm />
      </div>
    </>
  );
}
