"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin/users";
import { resetPassword, type ResetPasswordState } from "../password-actions";

const field = "min-h-11 rounded-control border border-field px-3 font-normal";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(resetPassword, {});

  if (state.done) {
    return (
      <div role="status" className="mt-6 grid gap-3 text-sm text-ink">
        <p>Listo, tu contraseña cambió. Las sesiones abiertas de tu cuenta se cierran en menos de un minuto.</p>
        <Link href="/admin/login" className="font-medium text-brand-700 underline underline-offset-2">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <label className="grid gap-1.5 text-sm font-medium text-ink">
        Contraseña nueva
        <input name="password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} className={field} />
        <span className="text-xs font-normal text-graphite">Al menos {MIN_PASSWORD_LENGTH} caracteres.</span>
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-ink">
        Repite la contraseña
        <input name="confirm" type="password" autoComplete="new-password" required className={field} />
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
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
