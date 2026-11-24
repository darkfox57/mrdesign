"use client";

import { useActionState } from "react";
import { removeMedia, updateAltText, type MediaActionState } from "./actions";

const button = "min-h-11 rounded-control border border-line px-3 text-sm font-medium text-ink hover:border-ink disabled:opacity-60";

function Feedback({ state }: { state: MediaActionState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-medium text-danger">
        {state.error}
      </p>
    );
  return state.ok ? (
    <p role="status" className="text-sm text-graphite">
      {state.ok}
    </p>
  ) : null;
}

export function AltTextForm({ mediaId, name, alt }: { mediaId: string; name: string; alt: string }) {
  const [state, action, pending] = useActionState<MediaActionState, FormData>(updateAltText, {});

  return (
    <form action={action} className="grid gap-1.5">
      <input type="hidden" name="mediaId" value={mediaId} />
      <label className="grid gap-1 text-xs font-medium text-graphite">
        Texto alternativo
        <input
          name="alt"
          defaultValue={alt}
          maxLength={300}
          // Required, but checked on the server so the message explains why.
          aria-required="true"
          aria-invalid={state.error ? true : undefined}
          aria-label={`Texto alternativo de ${name}`}
          placeholder="Describe la imagen"
          className="min-h-11 rounded-control border border-field bg-surface px-3 text-sm font-normal text-ink"
        />
      </label>
      <button type="submit" disabled={pending} aria-label={`Guardar texto de ${name}`} className={button}>
        Guardar texto
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function DeleteMediaForm({ mediaId, name }: { mediaId: string; name: string }) {
  const [state, action, pending] = useActionState<MediaActionState, FormData>(removeMedia, {});

  return (
    <form action={action} className="grid gap-1.5">
      <input type="hidden" name="mediaId" value={mediaId} />
      <button type="submit" disabled={pending} aria-label={`Eliminar ${name}`} className={`${button} text-danger`}>
        Eliminar
      </button>
      {state.error ? <Feedback state={state} /> : null}
    </form>
  );
}
