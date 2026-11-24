import { z } from "zod";
import { routing } from "@/i18n/routing";
import { sanitizePostHtml } from "@/lib/sanitize-post-html";
import { slugify } from "@/lib/slugify";

export const SEO_DESCRIPTION_MAX = 160;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value));

const schema = z.object({
  locale: z.enum(routing.locales, "Elige un idioma."),
  title: z.string().trim().min(1, "Escribe el título.").max(200, "Máximo 200 caracteres."),
  slug: z.string().trim().max(200),
  excerpt: z.string().trim().min(1, "Escribe el resumen.").max(300, "Máximo 300 caracteres."),
  content: z.string().max(500_000, "El contenido es demasiado largo."),
  coverImageUrl: z.union([z.literal(""), z.url({ protocol: /^https$/, error: "La portada tiene que ser una URL https." })]),
  coverImageAlt: optionalText(300),
  seoTitle: optionalText(70),
  seoDescription: optionalText(SEO_DESCRIPTION_MAX),
  categoryIds: z.array(z.string().min(1)).max(10),
});

// What arrives from the form: plain strings, validated here.
export type PostFormInput = Record<Exclude<keyof z.input<typeof schema>, "categoryIds">, string> & { categoryIds: string[] };
export type PostFormField = keyof PostFormInput;
export type PostFormData = Omit<z.output<typeof schema>, "coverImageUrl"> & { coverImageUrl: string | null };

const hasText = (html: string) => /<img\s[^>]*src=/i.test(html) || html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() !== "";

// The sanitizer keeps an <img> whose unsafe src it removed (pinned by its own tests for the
// legacy import); from the dashboard such an image is useless, so it goes.
const dropImagesWithoutSource = (html: string) => html.replace(/<img(?![^>]*\ssrc=)[^>]*>/gi, "");

// Validates the form and returns what may be stored: the slug normalized (from the title when
// empty) and the content sanitized. The only place post HTML from the dashboard is accepted.
// `coverPrefixes`: where a cover may come from (the R2 media library).
// Public pages render covers with next/image, which refuses any other host and would break the page.
export function parsePostForm(
  input: PostFormInput,
  { coverPrefixes }: { coverPrefixes?: string[] } = {},
): { success: true; data: PostFormData } | { success: false; fieldErrors: Partial<Record<PostFormField, string>> } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    return { success: false, fieldErrors: Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages?.[0]])) };
  }

  const fieldErrors: Partial<Record<PostFormField, string>> = {};
  const slug = slugify(parsed.data.slug || parsed.data.title);
  if (!slug) fieldErrors.slug = "El slug necesita letras o números.";
  const cover = parsed.data.coverImageUrl;
  if (cover && coverPrefixes && !coverPrefixes.some((prefix) => cover.startsWith(prefix))) {
    fieldErrors.coverImageUrl = "Elige la portada desde la biblioteca de imágenes.";
  }
  const content = dropImagesWithoutSource(sanitizePostHtml(parsed.data.content));
  if (!hasText(content)) fieldErrors.content = "Escribe el contenido del post.";
  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };

  return { success: true, data: { ...parsed.data, slug, content, coverImageUrl: parsed.data.coverImageUrl || null } };
}
