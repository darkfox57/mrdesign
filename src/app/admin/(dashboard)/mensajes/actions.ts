"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { INBOX_PATH, messageIdSchema, readChangeSchema } from "@/lib/admin/messages";

export type InboxActionState = { ok?: string; error?: string };

const INVALID_ACTION = "Acción no válida. Recarga la página y prueba de nuevo.";
const MISSING_MESSAGE = "El mensaje ya no existe.";

// Contact messages hold personal data: admins only, on the page and in every action.
export async function setRead(_: InboxActionState, formData: FormData): Promise<InboxActionState> {
  await requireSession(["admin"]);
  const parsed = readChangeSchema.safeParse({ messageId: formData.get("messageId"), read: formData.get("read") });
  if (!parsed.success) return { error: INVALID_ACTION };

  // updateMany reports how many rows matched, so a stale or crafted id is caught here.
  const { count } = await db.contactSubmission.updateMany({
    where: { id: parsed.data.messageId },
    data: { readAt: parsed.data.read ? new Date() : null },
  });
  if (count === 0) return { error: MISSING_MESSAGE };
  // The layout shows the unread count in the sidebar, and the home shows the totals.
  revalidatePath("/admin", "layout");
  return { ok: parsed.data.read ? "Mensaje marcado como leído." : "Mensaje marcado como no leído." };
}

export async function deleteMessage(_: InboxActionState, formData: FormData): Promise<InboxActionState> {
  await requireSession(["admin"]);
  const parsed = messageIdSchema.safeParse({ messageId: formData.get("messageId") });
  if (!parsed.success) return { error: INVALID_ACTION };

  const { count } = await db.contactSubmission.deleteMany({ where: { id: parsed.data.messageId } });
  if (count === 0) return { error: MISSING_MESSAGE };
  revalidatePath("/admin", "layout");
  // Outside any try/catch: redirect() throws to navigate.
  redirect(`${INBOX_PATH}?eliminado=1`);
}
