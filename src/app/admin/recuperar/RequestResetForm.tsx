"use client";

import { useActionState } from "react";
import { requestPasswordReset, type RequestResetState } from "../password-actions";

export function RequestResetForm() {
  const [state, action, pending] = useActionState<RequestResetState, FormData>(requestPasswordReset, {});

  if (state.sent) {
    return (
      <p role="status" className="mt-6 text-sm text-ink">
        Si el email está registrado, te enviamos un enlace para restablecer la contraseña.
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <label className="grid gap-1.5 text-sm font-medium text-ink">
        Email
        <input name="email" type="email" autoComplete="username" required defaultValue={state.email} className="min-h-11 rounded-control border border-field px-3 font-normal" />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-brand-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-control bg-brand-600 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
}
