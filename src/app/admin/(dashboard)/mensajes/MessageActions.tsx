"use client";

import { useActionState } from "react";
import { deleteMessage, setRead, type InboxActionState } from "./actions";

const button =
  "min-h-11 rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-ink disabled:opacity-60";

function Feedback({ state }: { state: InboxActionState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-medium text-danger">
        {state.error}
      </p>
    );
  return state.ok ? (
    <p role="status" className="text-sm text-success">
      {state.ok}
    </p>
  ) : null;
}

export function ReadToggle({ messageId, read }: { messageId: string; read: boolean }) {
  const [state, action, pending] = useActionState<InboxActionState, FormData>(setRead, {});
  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="messageId" value={messageId} />
      <input type="hidden" name="read" value={read ? "false" : "true"} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Guardando…" : read ? "Marcar como no leído" : "Marcar como leído"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function DeleteMessage({ messageId }: { messageId: string }) {
  const [state, action, pending] = useActionState<InboxActionState, FormData>(deleteMessage, {});
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar este mensaje? No se puede deshacer.")) event.preventDefault();
      }}
      className="grid gap-1"
    >
      <input type="hidden" name="messageId" value={messageId} />
      <button type="submit" disabled={pending} className={`${button} text-danger hover:border-danger`}>
        {pending ? "Eliminando…" : "Eliminar mensaje"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
