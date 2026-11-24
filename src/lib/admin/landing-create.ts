import { routing, type Locale } from "@/i18n/routing";
import { slugify } from "@/lib/slugify";
import { PAGE_FIELD_LIMITS, type PageFields } from "@/lib/visual-builder/page-fields";
import { validateBuilderData, type BuilderPage } from "@/lib/visual-builder/validate";

// A landing created from the dashboard. It starts as a draft with no blocks; the visual editor
// builds and publishes its page.

export const LANDINGS_ADMIN_PATH = "/admin/landings";

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

// Where the visual editor starts: the saved draft, else the published blocks, else an empty page.
// The page fields come from the landing's columns, overridden by the draft's own (saving a draft
// keeps them there until it is published).
export function editorStartData(landing: EditableLanding): { root: { props: PageFields }; content: unknown[] } {
  const published: PageFields = {
    title: landing.title,
    slug: landing.slug,
    seoTitle: landing.seoTitle ?? "",
    seoDescription: landing.seoDescription ?? "",
  };
  const stored = (landing.draftBlocks ?? landing.blocks) as { content?: unknown; root?: { props?: Partial<PageFields> } } | null;
  const draftRoot = landing.draftBlocks ? (landing.draftBlocks as { root?: { props?: Partial<PageFields> } }).root?.props : undefined;
  return {
    root: { props: { ...published, ...draftRoot } },
    content: stored && Array.isArray(stored.content) ? stored.content : [],
  };
}

// A landing can go public only with something to show: blocks published from the visual editor.
export function canPublishLanding(landing: { blocks: unknown }) {
  return landing.blocks !== null;
}
