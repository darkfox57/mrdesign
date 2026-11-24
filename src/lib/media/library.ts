import "server-only";
import { db } from "../db";
import { R2NotConfiguredError, deleteObject, headObject, isR2Configured, mediaPublicUrl, presignUpload } from "./r2";
import { MAX_IMAGE_BYTES, hexToBase64, mediaKey, type ImageContentType } from "./rules";

export type UploadRequest = { sha256: string; size: number; contentType: ImageContentType; name: string };

const mediaSelect = { id: true, url: true, alt: true, originalName: true, contentType: true, size: true, createdAt: true } as const;

// The same content always has the same hash: an image already in the library is reused, not uploaded again.
export async function requestUpload(request: UploadRequest) {
  const existing = await db.mediaFile.findUnique({ where: { sha256: request.sha256 }, select: mediaSelect });
  if (existing) return { status: "existing" as const, media: existing };

  const key = mediaKey(request.sha256, request.contentType);
  const upload = await presignUpload({ key, contentType: request.contentType, size: request.size, sha256: request.sha256 });
  return { status: "upload" as const, ...upload };
}

export class UploadVerificationError extends Error {}

// Registers an upload only after checking, in R2 itself, that the object is the approved one.
// A mismatching object is deleted so nothing unverified stays in the bucket.
export async function registerUpload(
  { sha256, contentType, name }: { sha256: string; contentType: ImageContentType; name: string },
  uploadedById: string,
) {
  const existing = await db.mediaFile.findUnique({ where: { sha256 }, select: mediaSelect });
  if (existing) return existing;

  const key = mediaKey(sha256, contentType);
  const stored = await headObject(key);
  if (!stored) throw new UploadVerificationError("La imagen no llegó a subirse. Prueba de nuevo.");

  const matches =
    stored.size > 0 && stored.size <= MAX_IMAGE_BYTES && stored.contentType === contentType && stored.checksumSha256 === hexToBase64(sha256);
  if (!matches) {
    await deleteObject(key);
    throw new UploadVerificationError("La imagen subida no coincide con la que se pidió subir.");
  }

  // Upsert: two editors uploading the same image at once end up with one row.
  return db.mediaFile.upsert({
    where: { sha256 },
    update: {},
    create: { sha256, key, url: mediaPublicUrl(key), contentType, size: stored.size, originalName: name, uploadedById },
    select: mediaSelect,
  });
}

export async function listMedia({ page, pageSize }: { page: number; pageSize: number }) {
  const [items, total] = await Promise.all([
    db.mediaFile.findMany({ orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize, select: mediaSelect }),
    db.mediaFile.count(),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

// Each check returns labels like "Post: <title>" for the places that use the image URL.
export type MediaUsageCheck = (url: string) => Promise<string[]>;

// Posts that show the image as their cover or inside their body. The body is sanitized HTML,
// where a library URL (https, hex key, no "&") is stored as it is, so a substring match finds it.
const postUsage: MediaUsageCheck = async (url) => {
  const posts = await db.post.findMany({
    where: { OR: [{ coverImageUrl: url }, { content: { contains: url } }] },
    orderBy: [{ title: "asc" }, { id: "asc" }],
    select: { title: true },
    take: 5,
  });
  return posts.map((post) => `Post: ${post.title}`);
};

// Hook point: every module that stores image URLs adds its check here, so an image it uses
// cannot be deleted. The landing builder adds its own when it ships.
const usageChecks: MediaUsageCheck[] = [postUsage];

export async function mediaUsage(url: string) {
  const results = await Promise.all(usageChecks.map((check) => check(url)));
  return results.flat();
}

export class MediaInUseError extends Error {
  constructor(readonly usedIn: string[]) {
    super("La imagen está en uso.");
  }
}

// `usage` exists for the tests; callers keep the default.
export async function deleteMedia(id: string, usage: MediaUsageCheck = mediaUsage) {
  const media = await db.mediaFile.findUnique({ where: { id }, select: { key: true, url: true } });
  if (!media) return;
  // Checked before touching the row: without R2 the object delete would fail after the row is gone.
  if (!isR2Configured()) throw new R2NotConfiguredError("R2 is not configured.");
  const usedIn = await usage(media.url);
  if (usedIn.length > 0) throw new MediaInUseError(usedIn);
  // Row first: if the object delete fails, a stray object is harmless; a row without an object is a broken image.
  await db.mediaFile.delete({ where: { id } });
  await deleteObject(media.key);
}
