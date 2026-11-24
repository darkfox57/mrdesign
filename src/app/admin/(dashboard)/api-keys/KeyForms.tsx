"use client";

import { useActionState } from "react";
import { createApiKey, revokeApiKey, type CreateKeyState, type RevokeKeyState } from "./actions";

const field = "min-h-11 rounded-control border border-field bg-surface px-3 font-normal";

export function NewKeyForm() {
  const [state, action, pending] = useActionState<CreateKeyState, FormData>(createApiKey, {});

  return (
    <div className="grid gap-4">
      {state.key ? (
        <div role="status" className="grid gap-2 rounded-card border-2 border-success bg-surface p-5">
          <p className="font-medium text-ink">API key creada para «{state.name}».</p>
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            API key nueva
            <input
              readOnly
              value={state.key}
              onFocus={(event) => event.currentTarget.select()}
              className={`${field} font-mono text-sm`}
            />
          </label>
          <p className="text-sm font-medium text-brand-700">Cópiala ahora: no se vuelve a mostrar.</p>
          <p className="text-sm text-graphite">
            Se envía en cada solicitud como <code>Authorization: Bearer &lt;key&gt;</code> a <code>POST /api/blog</code>.
          </p>
        </div>
      ) : null}

      <form action={action} aria-label="Nueva API key" noValidate className="grid gap-4 rounded-card border border-line bg-surface p-5">
        <h2 className="text-lg font-semibold text-ink">Nueva API key</h2>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Nombre
          <input
            name="name"
            defaultValue={state.key ? "" : state.name}
            maxLength={80}
            placeholder="Por ejemplo: generador de contenidos"
            aria-describedby={state.error ? "key-name-error" : undefined}
            aria-invalid={state.error ? true : undefined}
            className={field}
          />
          {state.error ? (
            <span id="key-name-error" className="text-sm font-medium text-brand-700">
              {state.error}
            </span>
          ) : null}
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="publishImmediately" defaultChecked className="size-4" />
          Publicar los posts directamente
        </label>
        <p className="-mt-2 text-sm text-graphite">Sin marcar, los posts que lleguen con esta key quedan como borrador hasta que los publiques.</p>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 justify-self-start rounded-control bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Creando…" : "Crear API key"}
        </button>
      </form>
    </div>
  );
}

export function RevokeKeyForm({ keyId, name }: { keyId: string; name: string }) {
  const [state, action, pending] = useActionState<RevokeKeyState, FormData>(revokeApiKey, {});

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`¿Revocar «${name}»? Lo que la use dejará de poder publicar.`)) event.preventDefault();
      }}
      className="grid gap-1"
    >
      <input type="hidden" name="keyId" value={keyId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Revocar ${name}`}
        className="min-h-11 rounded-control border border-line px-4 text-sm font-medium text-brand-700 hover:border-ink disabled:opacity-60"
      >
        Revocar
      </button>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-brand-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
