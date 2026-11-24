import { z } from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// SVG is left out on purpose: it can carry scripts and would be served from our own domain.
export const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
} as const;

export type ImageContentType = keyof typeof IMAGE_EXTENSIONS;
export const IMAGE_CONTENT_TYPES = Object.keys(IMAGE_EXTENSIONS) as ImageContentType[];

const sha256Hex = z.string().regex(/^[0-9a-f]{64}$/, "Huella de archivo no válida.");

export const uploadRequestSchema = z.object({
  sha256: sha256Hex,
  size: z.number().int().min(1, "La imagen está vacía.").max(MAX_IMAGE_BYTES, "La imagen pesa más de 5 MB."),
  contentType: z.enum(IMAGE_CONTENT_TYPES, "Usa una imagen JPG, PNG, WebP, AVIF o GIF."),
  name: z.string().trim().min(1).max(200),
});

export const registerUploadSchema = z.object({ sha256: sha256Hex, name: z.string().trim().min(1).max(200) });

// Alt text is required: an image without a description cannot be used accessibly on the site.
export const altTextSchema = z.object({
  mediaId: z.string().min(1),
  alt: z.string().trim().min(1, "Escribe el texto alternativo.").max(300, "Máximo 300 caracteres."),
});

export const deleteMediaSchema = z.object({ mediaId: z.string().min(1) });

// The key comes from the content hash: the same image always maps to the same object.
export function mediaKey(sha256: string, contentType: ImageContentType) {
  return `media/${sha256}.${IMAGE_EXTENSIONS[contentType]}`;
}

// S3 checksums are the base64 of the raw digest, not the hex string.
export function hexToBase64(hex: string) {
  return Buffer.from(hex, "hex").toString("base64");
}

export function publicMediaUrl(base: string, key: string) {
  return `${base.replace(/\/+$/, "")}/${key}`;
}
