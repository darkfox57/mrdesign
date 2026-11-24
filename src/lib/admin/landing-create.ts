import { z } from "zod";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_IN_SENTENCE } from "@/lib/admin/posts";
import { slugify } from "@/lib/slugify";
import { PAGE_FIELD_LIMITS, type PageFields } from "@/lib/visual-builder/page-fields";
import { validateBuilderData, type BuilderPage } from "@/lib/visual-builder/validate";

// A landing created from the dashboard. It starts as a draft with no blocks; the visual editor
// builds and publishes its page.

export const LANDINGS_ADMIN_PATH = "/admin/landings";

// Landing ids come from the URL and from forms: anything but a plain id is refused before it
// reaches the database.
const landingIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/);

export function parseLandingId(raw: unknown): string | null {
  const parsed = landingIdSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export type NewLanding = { locale: Locale; title: string; slug: string };

export function parseNewLanding(raw: Record<string, unknown>): { success: true; data: NewLanding } | { success: false; errors: string[] } {
  const read = (name: string) => (typeof raw[name] === "string" ? (raw[name] as string).trim() : "");
  const locale = read("locale");
  const title = read("title");
  const errors: string[] = [];
  if (!routing.locales.includes(locale as Locale)) errors.push("Idioma: elige español o inglés.");
  if (!title) errors.push("Título: no puede quedar vacío.");
  else if (title.length > PAGE_FIELD_LIMITS.title) errors.push(`Título: máximo ${PAGE_FIELD_LIMITS.title} caracteres.`);
  if (errors.length > 0) return { success: false, errors };

  const slug = slugify(read("slug") || title).slice(0, PAGE_FIELD_LIMITS.slug).replace(/-+$/g, "");
  if (!slug) return { success: false, errors: ["Slug: necesita letras o números."] };
  return { success: true, data: { locale: locale as Locale, title, slug } };
}

// A translation starts with the original's blocks (its draft when it has one) so only the texts
// need rewriting. The page fields (title, slug, SEO) are the new landing's own, so they are left out.
// Anything that does not pass validation starts as an empty page instead.
export function translationStart(source: { blocks: unknown; draftBlocks: unknown }): BuilderPage {
  const stored = (source.draftBlocks ?? source.blocks) as { content?: unknown } | null;
  const page = validateBuilderData({ root: { props: {} }, content: stored && Array.isArray(stored.content) ? stored.content : [] });
  return page.success ? page.data : { root: { props: {} }, content: [] };
}

type EditableLanding = {
  title: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: unknown;
  draftBlocks: unknown;
};

export const EDITOR_NOTICES = {
  invalidDraft: "El borrador guardado tiene bloques que ya no son válidos, así que el editor abre lo publicado. Si guardas, ese borrador se reemplaza.",
  invalidPage: "Los bloques guardados de esta landing ya no son válidos, así que el editor abre una página vacía. Si guardas, se reemplazan.",
} as const;

export type EditorStart = { data: { root: { props: PageFields }; content: BuilderPage["content"] }; notice: string | null };

// Where the visual editor starts: the saved draft, else the published blocks, else an empty page.
// Both go through validateBuilderData first, so the editor never receives blocks the save would
// refuse; one that fails is skipped and the notice says so. The page fields come from the
// landing's columns, overridden by the draft's own (saving a draft keeps them there until it is
// published).
export function editorStartData(landing: EditableLanding): EditorStart {
  const published: PageFields = {
    title: landing.title,
    slug: landing.slug,
    seoTitle: landing.seoTitle ?? "",
    seoDescription: landing.seoDescription ?? "",
  };
  const draft = landing.draftBlocks === null ? null : validateBuilderData(landing.draftBlocks);
  if (draft?.success) {
    return { data: { root: { props: { ...published, ...draft.data.root.props } }, content: draft.data.content }, notice: null };
  }
  const blocks = landing.blocks === null ? null : validateBuilderData(landing.blocks);
  if (blocks?.success) {
    return { data: { root: { props: published }, content: blocks.data.content }, notice: draft ? EDITOR_NOTICES.invalidDraft : null };
  }
  return { data: { root: { props: published }, content: [] }, notice: draft || blocks ? EDITOR_NOTICES.invalidPage : null };
}

// One definition of "has an unpublished draft" for the list and the editor: a stored draft, even
// one equal to the published page, so the editor can always discard what the list reports.
export function hasLandingDraft(landing: { draftBlocks: unknown }) {
  return landing.draftBlocks !== null;
}

type TranslationSource = { title: string; locale: Locale };

export type TranslationRequest<S extends TranslationSource> =
  | { kind: "none" }
  | { kind: "invalid"; message: string }
  | { kind: "ready"; source: S; locale: Locale };

// The ?traducir=<landing id>&idioma=<locale> of the new landing page. A link that names a source but
// no usable language, a missing source or the source's own language is reported instead of
// silently becoming an unrelated new landing.
export async function resolveTranslationRequest<S extends TranslationSource>(
  params: { traducir?: string; idioma?: string },
  findSource: (id: string) => Promise<S | null>,
): Promise<TranslationRequest<S>> {
  if (params.traducir === undefined) return { kind: "none" };
  const locale = params.idioma;
  if (!routing.locales.includes(locale as Locale)) {
    return {
      kind: "invalid",
      message: "El enlace de traducción no indica a qué idioma traducir. Vuelve a las landings y usa «Traducir al…» de la landing.",
    };
  }
  const id = parseLandingId(params.traducir);
  const source = id ? await findSource(id) : null;
  if (!source) return { kind: "invalid", message: "La landing que quieres traducir no existe. Vuelve a las landings y elige otra." };
  if (source.locale === locale) {
    return { kind: "invalid", message: `«${source.title}» ya está en ${LOCALE_IN_SENTENCE[source.locale]}: la traducción tiene que ser a otro idioma.` };
  }
  return { kind: "ready", source, locale: locale as Locale };
}

// A landing can go public only with something to show: blocks published from the visual editor.
export function canPublishLanding(landing: { blocks: unknown }) {
  return landing.blocks !== null;
}
