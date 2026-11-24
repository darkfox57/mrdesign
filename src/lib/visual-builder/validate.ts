import { z } from "zod";
import { rootPropsSchema } from "./page-fields";

// Server-side check of what the visual builder sends: the browser's editor is not trusted. Every
// block type has a strict schema; slots only take the block types they allow; links can only be
// relative paths, anchors, https or mailto (never javascript:, data: or plain http).

const MAX_BLOCKS = 100;
const MAX_DEPTH = 3;
const text = (max: number) => z.string().max(max);

const SAFE_LINK = /^(\/(?![/\\])|#|https:\/\/|mailto:)/i;
// Backslashes, whitespace and control characters: browsers fold "/\host" or "/<tab>/host" into an
// off-site "//host", so none of them may appear anywhere in a link or an image URL.
const UNSAFE_URL_CHARS = /[\\\s\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
export const safeLink = z
  .string()
  .max(500)
  .refine((href) => href === "" || (SAFE_LINK.test(href) && !UNSAFE_URL_CHARS.test(href)), {
    message: "enlace no permitido (usa una ruta del sitio, https:// o mailto:)",
  });

// Library (R2) images: https only. The save actions also check the host (imageHostErrors).
const imageUrl = z
  .string()
  .max(500)
  .refine((url) => url === "" || (/^https:\/\//i.test(url) && !UNSAFE_URL_CHARS.test(url)), { message: "la imagen tiene que ser https://" });

// Named variants only: blocks never take free colors, sizes or classes.
const background = z.enum(["paper", "surface", "ink"]);
// Blocks that fit inside the hero's side and inside columns (config.tsx COLUMN_BLOCKS).
export const COLUMN_BLOCKS = ["TextImage", "Button"] as const;
const slot = z.array(z.unknown()).max(50);

type BlockDefinition = { props: z.ZodObject; slots?: Record<string, readonly string[]> };

const withId = <T extends z.ZodRawShape>(shape: T) => z.strictObject({ id: z.string().min(1).max(100), ...shape });

// Keep in sync with the editor's config (src/lib/visual-builder/config.tsx): same types, fields and slot rules.
export const BLOCKS: Record<string, BlockDefinition> = {
  Hero: {
    props: withId({
      eyebrow: text(80),
      title: text(200),
      lead: text(600),
      primaryLabel: text(60),
      primaryHref: safeLink,
      secondaryLabel: text(60),
      secondaryHref: safeLink,
      background: z.enum(["paper", "ink"]),
      side: slot,
    }),
    slots: { side: COLUMN_BLOCKS },
  },
  Cards: {
    props: withId({
      title: text(200),
      intro: text(600),
      background,
      columns: z.enum(["2", "3"]),
      items: z.array(z.strictObject({ title: text(120), text: text(600) })).max(12),
    }),
  },
  Faq: {
    props: withId({
      title: text(200),
      background: z.enum(["paper", "surface"]),
      items: z.array(z.strictObject({ question: text(200), answer: text(1200) })).max(20),
    }),
  },
  Columns: {
    props: withId({ ratio: z.enum(["1-1", "2-1", "1-2"]), background, left: slot, right: slot }),
    slots: { left: COLUMN_BLOCKS, right: COLUMN_BLOCKS },
  },
  TextImage: {
    props: withId({
      title: text(200),
      text: text(2000),
      imageUrl,
      imageAlt: text(300),
      imageSide: z.enum(["left", "right"]),
      background,
    }),
  },
  Button: {
    props: withId({ label: text(60), href: safeLink, variant: z.enum(["primary", "secondary"]), align: z.enum(["left", "center"]) }),
  },
  Cta: {
    props: withId({ title: text(200), text: text(600), buttonLabel: text(60), buttonHref: safeLink, background: z.enum(["brand", "ink"]) }),
  },
};

const pageSchema = z.object({
  // The page fields (title, slug, SEO), edited as Puck root fields.
  root: z.object({ props: rootPropsSchema.optional() }).optional(),
  content: z.array(z.unknown()).max(MAX_BLOCKS, `La página tiene más de ${MAX_BLOCKS} bloques.`),
  zones: z.record(z.string(), z.unknown()).optional(),
});

const blockShape = z.object({ type: z.string(), props: z.record(z.string(), z.unknown()) });

type CleanBlock = { type: string; props: { id: string } & Record<string, unknown> };

// Returns the block rebuilt from the parsed props (only what the schemas describe, with its slot
// children cleaned the same way), or null after recording why it is not valid.
function validateBlock(raw: unknown, label: string, allowed: readonly string[] | null, depth: number, errors: string[]): CleanBlock | null {
  const shape = blockShape.safeParse(raw);
  if (!shape.success) {
    errors.push(`${label}: bloque mal formado.`);
    return null;
  }
  const { type, props } = shape.data;
  // Own keys only: "toString" or "__proto__" must not resolve to Object.prototype members.
  const definition = Object.hasOwn(BLOCKS, type) ? BLOCKS[type] : undefined;
  if (!definition) {
    errors.push(`${label}: tipo de bloque desconocido (${type}).`);
    return null;
  }
  if (allowed && !allowed.includes(type)) {
    errors.push(`${label}: ${type} no va en este lugar.`);
    return null;
  }

  const parsed = definition.props.safeParse(props);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors.push(`${label} (${type}), ${issue.path.join(".") || "campos"}: ${issue.message}`);
    return null;
  }
  const clean = { ...parsed.data } as CleanBlock["props"];
  for (const [slotName, slotAllowed] of Object.entries(definition.slots ?? {})) {
    const children = parsed.data[slotName] as unknown[];
    if (children.length > 0 && depth >= MAX_DEPTH) {
      errors.push(`${label}: demasiados niveles de bloques anidados.`);
      continue;
    }
    clean[slotName] = children
      .map((child, index) => validateBlock(child, `${label} > ${slotName} ${index + 1}`, slotAllowed, depth + 1, errors))
      .filter((child): child is CleanBlock => child !== null);
  }
  return { type, props: clean };
}

export type BuilderPage = { root: { props: Record<string, unknown> }; content: { type: string; props: { id: string } & Record<string, unknown> }[] };

export function validateBuilderData(raw: unknown): { success: true; data: BuilderPage } | { success: false; errors: string[] } {
  const page = pageSchema.safeParse(raw);
  if (!page.success) {
    return { success: false, errors: page.error.issues.map((issue) => issue.message || "La página está mal formada.") };
  }

  const errors: string[] = [];
  const content = page.data.content.map((block, index) => validateBlock(block, `Bloque ${index + 1}`, null, 1, errors));
  if (errors.length > 0) return { success: false, errors };
  // What is stored is the parsed page, not what the browser sent: extra keys never survive.
  // Legacy Puck zones are not used: only slots, which travel inside each block's props.
  return { success: true, data: { root: { props: page.data.root?.props ?? {} }, content: content as CleanBlock[] } };
}
