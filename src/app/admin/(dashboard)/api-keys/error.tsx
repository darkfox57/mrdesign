"use client";

// Shown when the API keys fail to load (for example, the database is unreachable).
export default function ApiKeysError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" className="rounded-card border border-line bg-surface p-5">
      <h1 className="text-headline text-ink">No se pudieron cargar las API keys</h1>
      <p className="mt-2 text-graphite">Prueba de nuevo en unos segundos. Si el problema sigue, revisa la conexión con la base de datos.</p>
      <button
        type="button"
        // retry() fetches the page again; reset() would only re-render what already failed.
        onClick={() => retry()}
        className="mt-4 min-h-11 rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-ink"
      >
        Reintentar
      </button>
    </div>
  );
}
