"use client";

import type { ErrorInfo } from "next/error";
import { useEffect } from "react";

// Shown when the inbox or a message fails to load (for example, the database is unreachable).
// Props follow next/error ErrorInfo: retry() fetches the segment again, reset() would only
// re-render what already failed (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md).
export default function InboxError({ error, retry }: ErrorInfo) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="rounded-card border border-line bg-surface p-5">
      <h1 className="text-headline text-ink">No se pudieron cargar los mensajes</h1>
      <p className="mt-2 text-graphite">Prueba de nuevo en unos segundos. Si el problema sigue, revisa la conexión con la base de datos.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 min-h-11 rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-ink"
      >
        Reintentar
      </button>
    </div>
  );
}
