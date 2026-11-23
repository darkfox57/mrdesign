"use client";

import { useActionState } from "react";
import { ROLE_LABELS } from "@/lib/admin/users";
import { ROLES, type Role } from "@/lib/auth/permissions";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin/users";
import { changeRole, setBlocked, setPassword, type AccountActionState } from "./actions";

const button = "min-h-11 rounded-control border border-line px-4 text-sm font-medium text-ink hover:border-ink disabled:opacity-60";

function Feedback({ state }: { state: AccountActionState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-medium text-brand-700">
        {state.error}
      </p>
    );
  return state.ok ? (
    <p role="status" className="text-sm text-graphite">
      {state.ok}
    </p>
  ) : null;
}

export function RoleForm({ userId, name, role }: { userId: string; name: string; role: Role | null }) {
  const [state, action, pending] = useActionState<AccountActionState, FormData>(changeRole, {});

  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="role"
          aria-label={`Rol de ${name}`}
          defaultValue={role ?? ""}
          className="min-h-11 rounded-control border border-field bg-white px-3 text-sm"
        >
          {role ? null : <option value="">Sin rol</option>}
          {ROLES.map((option) => (
            <option key={option} value={option}>
              {ROLE_LABELS[option]}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} aria-label={`Guardar rol de ${name}`} className={button}>
          Guardar rol
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function BlockForm({ userId, name, blocked }: { userId: string; name: string; blocked: boolean }) {
  const [state, action, pending] = useActionState<AccountActionState, FormData>(setBlocked, {});

  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="blocked" value={blocked ? "false" : "true"} />
      <button type="submit" disabled={pending} aria-label={`${blocked ? "Desbloquear" : "Bloquear"} a ${name}`} className={button}>
        {blocked ? "Desbloquear" : "Bloquear"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function PasswordForm({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState<AccountActionState, FormData>(setPassword, {});

  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          placeholder="Contraseña nueva"
          aria-label={`Contraseña nueva para ${name}`}
          className="min-h-11 w-44 rounded-control border border-field bg-white px-3 text-sm"
        />
        <button type="submit" disabled={pending} aria-label={`Cambiar la contraseña de ${name}`} className={button}>
          Cambiar
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}
