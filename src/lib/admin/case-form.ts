import { z } from "zod";
import { routing } from "@/i18n/routing";
import { CASE_LINES, isCaseLine, type CaseLine } from "@/lib/cases/lines";
import { isLibraryUrl } from "@/lib/media/cover-prefixes";
import { slugify } from "@/lib/slugify";

export const CASE_SEO_DESCRIPTION_MAX = 160;
export const CASE_SUMMARY_MAX = 400;
export const CASE_TEXT_MAX = 4000;
export const MAX_CASE_METRICS = 6;
export const MAX_CASE_GALLERY = 12;

export const CLIENT_AUTHORIZATION_REQUIRED = "Para publicar, el cliente tiene que haber autorizado el caso.";

export type CaseMetric = { label: string; value: string; source: string };
export type CaseImage = { url: string; alt: string };

// What arrives from the form: plain strings, booleans for the checkboxes and the repeated rows.
export type CaseFormInput = {
  locale: string;
  title: string;
  client: string;
  year: string;
  slug: string;
  lines: string[];
  summary: string;
  challenge: string;
  solution: string;
  result: string;
  metrics: CaseMetric[];
  // Technologies, separated by commas or lines.
  stack: string;
  websiteUrl: string;
  coverImageUrl: string;
  coverImageAlt: string;
  gallery: CaseImage[];
  clientAuthorized: boolean;
  featured: boolean;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
};
export type CaseFormField = keyof CaseFormInput;
export type CaseFieldErrors = Partial<Record<CaseFormField, string>>;

// A draft keeps whatever is written so far; publishing needs the whole case (see publishErrors).
export type CaseFormMode = "draft" | "publish";

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const optionalText = (max: number) => text(max).transform((value) => (value === "" ? null : value));
const httpsUrl = (error: string) => z.union([z.literal(""), z.url({ protocol: /^https$/, error })]).transform((value) => value || null);

const scalars = z.object({
  locale: z.enum(routing.locales, "Elige un idioma."),
  title: text(200),
  client: text(120),
  year: z
    .string()
    .trim()
    .refine((value) => value === "" || (/^\d{4}$/.test(value) && Number(value) >= 1990 && Number(value) <= 2100), "Escribe un año entre 1990 y 2100.")
    .transform((value) => (value === "" ? null : Number(value))),
  slug: z.string().trim().max(200, "Máximo 200 caracteres."),
  summary: text(CASE_SUMMARY_MAX),
  challenge: text(CASE_TEXT_MAX),
  solution: text(CASE_TEXT_MAX),
  result: text(CASE_TEXT_MAX),
  stack: z.string().max(2000, "Máximo 2000 caracteres."),
  websiteUrl: httpsUrl("El sitio tiene que ser una URL https."),
  coverImageUrl: httpsUrl("La portada tiene que ser una URL https."),
  coverImageAlt: optionalText(300),
  clientAuthorized: z.boolean(),
  featured: z.boolean(),
  sortOrder: z
    .string()
    .trim()
    .refine((value) => value === "" || (/^-?\d{1,4}$/.test(value)), "Escribe un número entero.")
    .transform((value) => (value === "" ? 0 : Number(value))),
  seoTitle: optionalText(70),
  seoDescription: optionalText(CASE_SEO_DESCRIPTION_MAX),
});

export type CaseFormData = Omit<z.output<typeof scalars>, "stack"> & {
  slug: string;
  lines: CaseLine[];
  metrics: CaseMetric[];
  stack: string[];
  gallery: CaseImage[];
};

const trimmed = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function parseLines(lines: string[]): { lines: CaseLine[] } | { error: string } {
  if (!lines.every(isCaseLine)) return { error: "Elige líneas de trabajo de la lista." };
  return { lines: CASE_LINES.filter((line) => lines.includes(line)) };
}

// Rows the form left blank are dropped; a row with something in it needs all three parts.
function parseMetrics(metrics: CaseMetric[]): { metrics: CaseMetric[] } | { error: string } {
  const rows = metrics
    .map((metric) => ({ label: trimmed(metric.label), value: trimmed(metric.value), source: trimmed(metric.source) }))
    .filter((metric) => metric.label || metric.value || metric.source);
  if (rows.length > MAX_CASE_METRICS) return { error: `Máximo ${MAX_CASE_METRICS} métricas.` };
  if (rows.some((metric) => !metric.label || !metric.value || !metric.source)) {
    return { error: "Cada métrica necesita nombre, valor y cómo se verifica." };
  }
  if (rows.some((metric) => metric.label.length > 80 || metric.value.length > 40 || metric.source.length > 200)) {
    return { error: "Una métrica es demasiado larga: nombre hasta 80, valor hasta 40 y verificación hasta 200 caracteres." };
  }
  return { metrics: rows };
}

function parseGallery(gallery: CaseImage[], prefixes: readonly string[] | undefined): { gallery: CaseImage[] } | { error: string } {
  const rows = gallery.map((item) => ({ url: trimmed(item.url), alt: trimmed(item.alt) })).filter((item) => item.url);
  if (rows.length > MAX_CASE_GALLERY) return { error: `Máximo ${MAX_CASE_GALLERY} imágenes en la galería.` };
  if (prefixes && rows.some((item) => !isLibraryUrl(item.url, prefixes))) return { error: "Elige las imágenes de la galería desde la biblioteca." };
  if (rows.some((item) => item.alt.length > 300)) return { error: "El texto alternativo de una imagen tiene máximo 300 caracteres." };
  return { gallery: rows };
}

function parseStack(stack: string) {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const item of stack.split(/[,\n]/).map((part) => part.trim())) {
    if (!item || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    items.push(item);
  }
  return items;
}

// What a published case must have. The client's authorization is a rule like the others: without
// it the case stays a draft, whatever else it has.
function publishErrors(data: CaseFormData): CaseFieldErrors {
  const errors: CaseFieldErrors = {};
  if (!data.title) errors.title = "Escribe el título.";
  if (!data.client) errors.client = "Escribe el cliente.";
  if (!data.summary) errors.summary = "Escribe el resumen.";
  if (!data.challenge) errors.challenge = "Escribe el reto.";
  if (!data.solution) errors.solution = "Escribe la solución.";
  if (!data.result) errors.result = "Escribe el resultado.";
  if (data.lines.length === 0) errors.lines = "Elige al menos una línea de trabajo.";
  if (!data.coverImageUrl) errors.coverImageUrl = "Elige la portada.";
  if (!data.coverImageAlt) errors.coverImageAlt = "Escribe el texto alternativo de la portada.";
  if (data.gallery.some((item) => !item.alt)) errors.gallery = "Escribe el texto alternativo de cada imagen de la galería.";
  if (!data.clientAuthorized) errors.clientAuthorized = CLIENT_AUTHORIZATION_REQUIRED;
  return errors;
}

// Validates the case form and returns what may be stored. `libraryPrefixes`: where the cover and
// the gallery may come from (the R2 media library, see coverPrefixes). Public pages render them with
// next/image, which refuses any other host.
export function parseCaseForm(
  input: CaseFormInput,
  { mode, libraryPrefixes }: { mode: CaseFormMode; libraryPrefixes?: readonly string[] },
): { success: true; data: CaseFormData } | { success: false; fieldErrors: CaseFieldErrors } {
  const fieldErrors: CaseFieldErrors = {};
  const parsed = scalars.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as CaseFormField;
      fieldErrors[key] ??= issue.message;
    }
  }

  const lines = parseLines(Array.isArray(input.lines) ? input.lines : []);
  if ("error" in lines) fieldErrors.lines = lines.error;
  const metrics = parseMetrics(Array.isArray(input.metrics) ? input.metrics : []);
  if ("error" in metrics) fieldErrors.metrics = metrics.error;
  const gallery = parseGallery(Array.isArray(input.gallery) ? input.gallery : [], libraryPrefixes);
  if ("error" in gallery) fieldErrors.gallery = gallery.error;
  if (!parsed.success || "error" in lines || "error" in metrics || "error" in gallery) return { success: false, fieldErrors };

  const values = parsed.data;
  const slug = slugify(values.slug || values.title || values.client);
  if (!slug) fieldErrors.slug = values.slug ? "El slug necesita letras o números." : "Escribe el título, el cliente o el slug.";
  if (values.coverImageUrl && libraryPrefixes && !isLibraryUrl(values.coverImageUrl, libraryPrefixes)) {
    fieldErrors.coverImageUrl = "Elige la portada desde la biblioteca de imágenes.";
  }

  const data: CaseFormData = {
    ...values,
    slug,
    lines: lines.lines,
    metrics: metrics.metrics,
    stack: parseStack(values.stack),
    gallery: gallery.gallery,
  };
  // Publishing reports what is missing together with any other error, so one try lists it all.
  if (mode === "publish") Object.assign(fieldErrors, { ...publishErrors(data), ...fieldErrors });
  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };
  return { success: true, data };
}

const isMetric = (value: unknown): value is CaseMetric =>
  typeof value === "object" && value !== null && ["label", "value", "source"].every((key) => typeof (value as Record<string, unknown>)[key] === "string");
const isImage = (value: unknown): value is CaseImage =>
  typeof value === "object" && value !== null && ["url", "alt"].every((key) => typeof (value as Record<string, unknown>)[key] === "string");

// A stored case as the form sends it: what the editor starts from, and what publishing from the
// list validates again. Malformed JSON columns read as empty instead of failing the page.
export function caseToFormInput(row: {
  locale: string;
  title: string;
  client: string;
  year: number | null;
  slug: string;
  lines: string[];
  summary: string;
  challenge: string;
  solution: string;
  result: string;
  metrics: unknown;
  stack: string[];
  websiteUrl: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  gallery: unknown;
  clientAuthorized: boolean;
  featured: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
}): CaseFormInput {
  const metrics = Array.isArray(row.metrics) && row.metrics.every(isMetric) ? row.metrics : [];
  const gallery = Array.isArray(row.gallery) && row.gallery.every(isImage) ? row.gallery : [];
  return {
    locale: row.locale,
    title: row.title,
    client: row.client,
    year: row.year === null ? "" : String(row.year),
    slug: row.slug,
    lines: [...row.lines],
    summary: row.summary,
    challenge: row.challenge,
    solution: row.solution,
    result: row.result,
    metrics: metrics.map(({ label, value, source }) => ({ label, value, source })),
    stack: row.stack.join(", "),
    websiteUrl: row.websiteUrl ?? "",
    coverImageUrl: row.coverImageUrl ?? "",
    coverImageAlt: row.coverImageAlt ?? "",
    gallery: gallery.map(({ url, alt }) => ({ url, alt })),
    clientAuthorized: row.clientAuthorized,
    featured: row.featured,
    sortOrder: String(row.sortOrder),
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
  };
}

// The hidden ids of the editor form (the case being edited, the case being translated). Empty
// means absent; anything else must look like a row id before it reaches a query.
const rowId = z.union([z.literal(""), z.string().regex(/^[\w-]{1,100}$/)]).transform((value) => value || null);
// `version`: the case's updatedAt as the editor loaded it (ISO); required by saveCase for an edit.
const version = z.union([z.literal(""), z.iso.datetime()]).transform((value) => (value ? new Date(value) : null));
export const caseIdsSchema = z.object({ caseId: rowId, translationOf: rowId, version });

export const casePublicationSchema = z.object({
  caseId: z.string().regex(/^[\w-]{1,100}$/),
  intent: z.enum(["publish", "unpublish"]),
});

const formText = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};
const formList = (formData: FormData, key: string) => formData.getAll(key).map((value) => (typeof value === "string" ? value : ""));

// The editor's fields as CaseFormInput. Repeated rows (metrics, gallery) come as parallel lists.
export function caseFormInputFromFormData(formData: FormData): CaseFormInput {
  const labels = formList(formData, "metricLabel");
  const metricValues = formList(formData, "metricValue");
  const sources = formList(formData, "metricSource");
  const galleryUrls = formList(formData, "galleryUrl");
  const galleryAlts = formList(formData, "galleryAlt");
  return {
    locale: formText(formData, "locale"),
    title: formText(formData, "title"),
    client: formText(formData, "client"),
    year: formText(formData, "year"),
    slug: formText(formData, "slug"),
    lines: formList(formData, "lines"),
    summary: formText(formData, "summary"),
    challenge: formText(formData, "challenge"),
    solution: formText(formData, "solution"),
    result: formText(formData, "result"),
    metrics: labels.map((label, index) => ({ label, value: metricValues[index] ?? "", source: sources[index] ?? "" })),
    stack: formText(formData, "stack"),
    websiteUrl: formText(formData, "websiteUrl"),
    coverImageUrl: formText(formData, "coverImageUrl"),
    coverImageAlt: formText(formData, "coverImageAlt"),
    gallery: galleryUrls.map((url, index) => ({ url, alt: galleryAlts[index] ?? "" })),
    clientAuthorized: formData.get("clientAuthorized") === "on",
    featured: formData.get("featured") === "on",
    sortOrder: formText(formData, "sortOrder"),
    seoTitle: formText(formData, "seoTitle"),
    seoDescription: formText(formData, "seoDescription"),
  };
}
