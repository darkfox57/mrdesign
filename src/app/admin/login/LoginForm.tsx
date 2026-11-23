"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "../actions";

const initialState: SignInState = {};

// Works without JavaScript too: the form posts straight to the server action.
export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="grid gap-1.5 text-sm font-medium text-ink">
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="min-h-11 rounded-control border border-field px-3 font-normal"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-ink">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-11 rounded-control border border-field px-3 font-normal"
        />
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
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
