import { z } from "zod";
import { slugify } from "@/lib/slugify";

// The page's own fields, edited as Puck root fields and stored in the Landing columns of the same
// names. validate.ts accepts exactly these root props; the save actions read them with parsePageFields.

export const PAGE_FIELD_LIMITS = { title: 200, slug: 80, seoTitle: 70, seoDescription: 160 } as const;

export const PAGE_FIELD_LABELS = {
  title: "Título de la página",
  slug: "Slug",
  seoTitle: "Título SEO",
  seoDescription: "Descripción SEO",
} as const;

export type PageFields = { title: string; slug: string; seoTitle: string; seoDescription: string };

const tooLong = (name: keyof typeof PAGE_FIELD_LIMITS) =>
  z.string().max(PAGE_FIELD_LIMITS[name], `${PAGE_FIELD_LABELS[name]}: máximo ${PAGE_FIELD_LIMITS[name]} caracteres.`);

// Strict and optional: a page without page fields (a translation before its first save) is still valid.
export const rootPropsSchema = z.strictObject({
  title: tooLong("title").optional(),
  slug: tooLong("slug").optional(),
  seoTitle: tooLong("seoTitle").optional(),
  seoDescription: tooLong("seoDescription").optional(),
});

export type LandingPageColumns = { title: string; slug: string; seoTitle: string | null; seoDescription: string | null };

export function parsePageFields(raw: unknown): { success: true; data: LandingPageColumns } | { success: false; errors: string[] } {
  const parsed = rootPropsSchema.safeParse(raw ?? {});
  const props = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const read = (name: keyof PageFields) => (typeof props[name] === "string" ? (props[name] as string).trim() : "");
  const title = read("title");
  const slug = slugify(read("slug"));
  const errors: string[] = [];
  if (!title) errors.push(`${PAGE_FIELD_LABELS.title}: no puede quedar vacío.`);
  if (!slug) errors.push(`${PAGE_FIELD_LABELS.slug}: no puede quedar vacío.`);
  if (!parsed.success) errors.push(...parsed.error.issues.map((issue) => issue.message));
  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: { title, slug, seoTitle: read("seoTitle") || null, seoDescription: read("seoDescription") || null } };
}
