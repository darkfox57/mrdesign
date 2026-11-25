import "server-only";
import { routing, type Locale } from "@/i18n/routing";
import { publicationChange } from "@/lib/admin/posts";
import { isUniqueViolation, violatesUnique } from "@/lib/blog/unique-violation";
import { db } from "@/lib/db";
import { nextVersion } from "@/lib/landings/editor";
import { MediaMissingError, withLibraryImages } from "@/lib/media/references";
import { caseToFormInput, parseCaseForm, type CaseFieldErrors, type CaseFormInput } from "./case-form";

export const CASES_ADMIN_PATH = "/admin/casos";
export const ADMIN_CASES_PER_PAGE = 25;

const SLUG_TAKEN = "Ya hay un caso con ese slug en este idioma.";
const TRANSLATION_TAKEN = "Este caso ya tiene versión en ese idioma.";
const UNIQUE_CLASH = "No se pudo guardar: otro registro ya usa alguno de estos datos. Revisa el formulario y vuelve a intentarlo.";
const CHANGED_MEANWHILE = "El caso cambió mientras lo editabas. Recarga la página y vuelve a intentarlo.";
const COVER_MISSING = "La portada no está en la biblioteca de imágenes: puede que la hayan borrado. Elige otra.";
const galleryMissing = (urls: string[]) =>
  `${urls.length === 1 ? "Una imagen" : "Varias imágenes"} de la galería no está${urls.length === 1 ? "" : "n"} en la biblioteca: puede que la hayan borrado. Quítala${urls.length === 1 ? "" : "s"} o elige otra${urls.length === 1 ? "" : "s"}.`;

// The public pages that show cases, as the routes the proxy rewrites to (every locale carries its
// prefix, Spanish too; see publicBlogPaths). Today the home page and the portfolio; the case pages
// join when they ship.
export function publicCasePaths() {
  return routing.locales.flatMap((locale) => [`/${locale}`, `/${locale}/portafolio`]);
}

export type SaveCaseResult =
  | { ok: true; id: string; created: boolean }
  | { ok: false; error?: string; fieldErrors?: CaseFieldErrors };

const libraryUrls = (data: { coverImageUrl: string | null; gallery: { url: string }[] }) => [data.coverImageUrl, ...data.gallery.map((item) => item.url)];

// A library image the case uses is not in the library: the field that holds it is named.
function missingImageErrors(missing: string[], cover: string | null): CaseFieldErrors {
  const fieldErrors: CaseFieldErrors = {};
  if (cover && missing.includes(cover)) fieldErrors.coverImageUrl = COVER_MISSING;
  const inGallery = missing.filter((url) => url !== cover);
  if (inGallery.length > 0) fieldErrors.gallery = galleryMissing(inGallery);
  return fieldErrors;
}

// Creates a case (as a draft) or updates one, and publishes it when `intent` is "publish".
// A published case is validated with the publishing rules on every save, so an edit cannot leave
// it published without what publishing requires (the client's authorization included).
// `caseId` and `translationOf` come from the client and are checked here.
//
// Optimistic concurrency, as in the landing editor (src/lib/landings/editor.ts): an edit sends the
// case's updatedAt as the editor loaded it (`version`) and only writes while the row still has it,
// moving it strictly forward. A stale tab cannot overwrite a newer save, nor publish over a save
// that withdrew the client's authorization.
export async function saveCase({
  caseId,
  translationOf,
  version,
  input,
  intent,
  libraryPrefixes,
}: {
  caseId: string | null;
  translationOf: string | null;
  version: Date | null;
  input: CaseFormInput;
  intent: "save" | "publish";
  libraryPrefixes: readonly string[];
}): Promise<SaveCaseResult> {
  const existing = caseId ? await db.case.findUnique({ where: { id: caseId }, select: { locale: true, status: true, publishedAt: true } }) : null;
  if (caseId && !existing) return { ok: false, error: "El caso ya no existe." };
  if (caseId && !version) return { ok: false, error: "Acción no válida." };
  if (intent === "publish" && existing?.status === "ARCHIVED") return { ok: false, error: "Un caso archivado no se publica desde aquí." };

  // A case keeps its language: translations are separate rows linked by translationKey.
  const values = existing ? { ...input, locale: existing.locale } : input;
  const mode = intent === "publish" || existing?.status === "PUBLISHED" ? "publish" : "draft";
  const parsed = parseCaseForm(values, { mode, libraryPrefixes });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  const data = parsed.data;

  // A new translation shares the original's translationKey; only one version per language.
  let translationKey: string | undefined;
  if (!caseId && translationOf) {
    const source = await db.case.findUnique({ where: { id: translationOf }, select: { locale: true, translationKey: true } });
    if (!source) return { ok: false, error: "El caso original ya no existe." };
    if (source.locale === data.locale) return { ok: false, error: "La traducción tiene que estar en otro idioma." };
    const sibling = await db.case.findUnique({
      where: { translationKey_locale: { translationKey: source.translationKey, locale: data.locale } },
      select: { id: true },
    });
    if (sibling) return { ok: false, error: TRANSLATION_TAKEN };
    translationKey = source.translationKey;
  }

  const taken = await db.case.findFirst({
    where: { locale: data.locale, slug: data.slug, ...(caseId ? { NOT: { id: caseId } } : {}) },
    select: { id: true },
  });
  if (taken) return { ok: false, fieldErrors: { slug: SLUG_TAKEN } };

  const publication = intent === "publish" ? publicationChange("publish", existing?.publishedAt ?? null) : {};
  const row = { ...data, metrics: data.metrics, gallery: data.gallery, ...publication };

  // The library images the case uses are locked with the write, so one deleted meanwhile refuses
  // the save instead of leaving the case pointing at it (src/lib/media/references.ts).
  try {
    const id = await withLibraryImages(libraryUrls(data), libraryPrefixes, async (tx) => {
      if (caseId && version) {
        // Only while the case is still the version the editor loaded (and so has the status the
        // rules were chosen for). One UPDATE ... WHERE id AND updatedAt: of two writes with the
        // same version only the first matches.
        const { count } = await tx.case.updateMany({ where: { id: caseId, updatedAt: version }, data: { ...row, updatedAt: nextVersion(version) } });
        return count === 0 ? null : caseId;
      }
      const created = await tx.case.create({ data: { ...row, ...(translationKey ? { translationKey } : {}), ...(intent === "publish" ? {} : { status: "DRAFT" }) } });
      return created.id;
    });
    if (id === null) return { ok: false, error: CHANGED_MEANWHILE };
    return { ok: true, id, created: !caseId };
  } catch (error) {
    if (error instanceof MediaMissingError) return { ok: false, fieldErrors: missingImageErrors(error.urls, data.coverImageUrl) };
    // Another save took the slug, or the translation slot, between the check and the write.
    if (violatesUnique(error, "Case", ["translationKey", "locale"])) return { ok: false, error: TRANSLATION_TAKEN };
    if (violatesUnique(error, "Case", ["locale", "slug"])) return { ok: false, fieldErrors: { slug: SLUG_TAKEN } };
    if (isUniqueViolation(error)) return { ok: false, error: UNIQUE_CLASH };
    throw error;
  }
}

export type CasePublicationResult = { ok: true; message: string } | { ok: false; error: string };

// Publishes or unpublishes a stored case from the list. Publishing checks the stored case with the
// same rules as the editor, client authorization included, and writes only while the case is still
// the version it checked.
export async function setCasePublication({
  caseId,
  intent,
  libraryPrefixes,
}: {
  caseId: string;
  intent: "publish" | "unpublish";
  libraryPrefixes: readonly string[];
}): Promise<CasePublicationResult> {
  const row = await db.case.findUnique({ where: { id: caseId } });
  if (!row) return { ok: false, error: "El caso ya no existe. Recarga la página." };
  // The list hides the button for archived cases; a replayed request gets the same answer.
  if (row.status === "ARCHIVED") return { ok: false, error: "Un caso archivado no se publica desde aquí." };

  let urls: (string | null)[] = [];
  if (intent === "publish") {
    const parsed = parseCaseForm(caseToFormInput(row), { mode: "publish", libraryPrefixes });
    if (!parsed.success) {
      const messages = Object.values(parsed.fieldErrors);
      return { ok: false, error: messages.length === 1 ? messages[0]! : `Completa el caso antes de publicarlo. ${messages.join(" ")}` };
    }
    urls = libraryUrls(parsed.data);
  }

  try {
    const { count } = await withLibraryImages(urls, libraryPrefixes, (tx) =>
      tx.case.updateMany({ where: { id: caseId, updatedAt: row.updatedAt }, data: { ...publicationChange(intent, row.publishedAt), updatedAt: nextVersion(row.updatedAt) } }),
    );
    if (count === 0) return { ok: false, error: CHANGED_MEANWHILE };
  } catch (error) {
    if (error instanceof MediaMissingError) return { ok: false, error: "Una imagen del caso ya no está en la biblioteca. Abre el caso y elige otra." };
    throw error;
  }
  return { ok: true, message: intent === "publish" ? "Publicado." : "Pasado a borrador." };
}

export type CaseListFilter = { status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; locale?: Locale; page: number };

// The dashboard list: newest edits first. A page past the last one shows the last one.
export async function listCases(filter: CaseListFilter) {
  const where = { ...(filter.status ? { status: filter.status } : {}), ...(filter.locale ? { locale: filter.locale } : {}) };
  const total = await db.case.count({ where });
  const pages = Math.max(1, Math.ceil(total / ADMIN_CASES_PER_PAGE));
  const page = Math.min(filter.page, pages);
  const items = await db.case.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * ADMIN_CASES_PER_PAGE,
    take: ADMIN_CASES_PER_PAGE,
    select: { id: true, title: true, client: true, slug: true, locale: true, status: true, clientAuthorized: true },
  });
  return { items, total, pages, page };
}

// The other-language versions of a case, for the translations panel.
export function caseTranslations(item: { id: string; translationKey: string }) {
  return db.case.findMany({
    where: { translationKey: item.translationKey, NOT: { id: item.id } },
    select: { id: true, locale: true, status: true },
  });
}

// How a case is named in the dashboard while its headline is still empty.
export const caseName = (item: { title: string; client: string; slug: string }) => item.title || item.client || item.slug;
