"use client";

import { useActionState } from "react";
import { MIN_PASSWORD_LENGTH, ROLE_LABELS } from "@/lib/admin/users";
import { ROLES } from "@/lib/auth/permissions";
import { createUser, type NewUserState } from "./actions";

const field = "min-h-11 rounded-control border border-field bg-white px-3 font-normal";
const label = "grid gap-1.5 text-sm font-medium text-ink";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <span id={id} className="text-sm font-medium text-brand-700">
      {message}
    </span>
  ) : null;
}

export function NewUserForm() {
  const [state, action, pending] = useActionState<NewUserState, FormData>(createUser, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} aria-label="Nuevo usuario" noValidate className="grid gap-4 rounded-card border border-line bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Nuevo usuario</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Nombre
          <input name="name" required autoComplete="off" defaultValue={state.values?.name} aria-describedby="name-error" className={field} />
          <FieldError id="name-error" message={errors.name} />
        </label>
        <label className={label}>
          Email
          <input name="email" type="email" required autoComplete="off" defaultValue={state.values?.email} aria-describedby="email-error" className={field} />
          <FieldError id="email-error" message={errors.email} />
        </label>
        <label className={label}>
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            aria-describedby="password-error"
            className={field}
          />
          <FieldError id="password-error" message={errors.password ?? `Al menos ${MIN_PASSWORD_LENGTH} caracteres.`} />
        </label>
        <label className={label}>
          Rol
          <select name="role" defaultValue={state.values?.role ?? "editor"} aria-describedby="role-error" className={field}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <FieldError id="role-error" message={errors.role} />
        </label>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-brand-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm font-medium text-ink">
          Usuario creado.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 justify-self-start rounded-control bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
