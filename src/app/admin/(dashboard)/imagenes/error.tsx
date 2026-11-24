"use client";

import { useEffect } from "react";

// Shown when the library cannot load (for example, the database is unreachable).
export default function MediaLibraryError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <h1 className="text-headline text-ink">Imágenes</h1>
      <div role="alert" className="mt-6 rounded-card border border-danger bg-surface p-6">
        <p className="font-medium text-ink">No se pudo cargar la biblioteca de imágenes.</p>
        <p className="mt-1 text-sm text-graphite">Revisa tu conexión y prueba de nuevo. Si el error sigue, avisa a un administrador.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-4 min-h-11 rounded-control border border-line px-4 text-sm font-medium text-ink hover:border-ink"
        >
          Reintentar
        </button>
      </div>
    </>
  );
}
