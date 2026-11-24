"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { listPickerMedia, type PickerMedia } from "./editor-actions";

// Modal over the image library. The parent opens it with `open` and gets the chosen image back.
export function MediaPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (media: PickerMedia) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // The form mounts two pickers (cover and editor): each needs its own heading id.
  const titleId = useId();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: PickerMedia[]; pages: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let current = true;
    listPickerMedia(page)
      .then((loaded) => {
        if (!current) return;
        setResult(loaded);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [open, page]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0 backdrop:bg-ink/40"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          Biblioteca de imágenes
        </h2>
        <button type="button" onClick={onClose} className="min-h-11 rounded-control border border-line px-4 text-sm font-medium text-ink hover:border-ink">
          Cerrar
        </button>
      </div>
      <div className="max-h-[70svh] overflow-y-auto p-5">
        {failed ? <p role="alert" className="text-sm font-medium text-brand-700">No se pudo cargar la biblioteca.</p> : null}
        {result && result.items.length === 0 ? (
          <p className="text-sm text-graphite">
            La biblioteca está vacía. Sube imágenes en{" "}
            <Link href="/admin/imagenes" className="text-brand-700 underline underline-offset-2">
              Imágenes
            </Link>
            .
          </p>
        ) : null}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {result?.items.map((media) => (
            <li key={media.id}>
              <button
                type="button"
                aria-label={`Usar ${media.originalName}`}
                onClick={() => onSelect(media)}
                className="grid w-full gap-1 rounded-control border border-line p-2 text-left text-xs text-ink hover:border-brand-600 focus-visible:border-brand-600"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.url} alt="" loading="lazy" className="aspect-video w-full rounded-control bg-paper object-contain" />
                <span className="truncate">{media.originalName}</span>
              </button>
            </li>
          ))}
        </ul>
        {result && result.pages > 1 ? (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="font-medium text-brand-700 disabled:opacity-40">
              Anterior
            </button>
            <span className="text-graphite">
              Página {page} de {result.pages}
            </span>
            <button type="button" disabled={page >= result.pages} onClick={() => setPage(page + 1)} className="font-medium text-brand-700 disabled:opacity-40">
              Siguiente
            </button>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
