import { z } from "zod";
import { services } from "@/content/services";
import type { Locale } from "@/i18n/routing";
import type { Role } from "@/lib/auth/permissions";

export const INBOX_PATH = "/admin/mensajes";
export const INBOX_PAGE_SIZE = 30;

// Contact messages hold personal data: only admins read them, in the inbox and on the dashboard home.
export function canReadInbox(role: Role) {
  return role === "admin";
}

export const LOCALE_LABELS: Record<Locale, string> = { es: "Español", en: "Inglés" };

const SERVICE_NAMES: Record<string, string> = Object.fromEntries(services.map((service) => [service.id, service.name.es]));

// The stored value is a service id or "other". Anything else (an old value) is shown as is.
export function projectTypeLabel(projectType: string) {
  if (projectType === "other") return "Otra cosa";
  return SERVICE_NAMES[projectType] ?? projectType;
}

const PREVIEW_LENGTH = 90;

export function messagePreview(text: string) {
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
}

const REPLY_SUBJECTS: Record<Locale, string> = {
  es: "Re: tu mensaje a MR Design",
  en: "Re: your message to MR Design",
};

// Encoded so nothing in the address can add mail headers; the @ stays readable for every mail client.
export function replyHref(email: string, locale: Locale) {
  const address = encodeURIComponent(email).replaceAll("%40", "@");
  return `mailto:${address}?subject=${encodeURIComponent(REPLY_SUBJECTS[locale])}`;
}

type SearchParam = string | string[] | undefined;
const first = (value: SearchParam) => (Array.isArray(value) ? value[0] : value);

const filterSchema = z.object({
  filtro: z.enum(["sin-leer"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  eliminado: z.literal("1").optional().catch(undefined),
});

export type InboxFilter = { unreadOnly: boolean; page: number; deleted: boolean };

// Search params come from the address bar: invalid values fall back to the defaults instead of failing.
export function parseInboxFilter(raw: Record<string, SearchParam>): InboxFilter {
  const parsed = filterSchema.parse({ filtro: first(raw.filtro), page: first(raw.page), eliminado: first(raw.eliminado) });
  return { unreadOnly: parsed.filtro === "sin-leer", page: parsed.page, deleted: parsed.eliminado === "1" };
}

export function inboxHref({ unreadOnly, page }: { unreadOnly: boolean; page: number }) {
  const params = new URLSearchParams();
  if (unreadOnly) params.set("filtro", "sin-leer");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `${INBOX_PATH}${query ? `?${query}` : ""}`;
}

const messageId = z.string().trim().min(1).max(64);

export const messageIdSchema = z.object({ messageId });

// The field carries the requested state, not a toggle, so a repeated submit cannot flip it back.
export const readChangeSchema = z.object({
  messageId,
  read: z.enum(["true", "false"]).transform((value) => value === "true"),
});
