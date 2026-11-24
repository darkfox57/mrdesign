// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// In-memory stand-in for R2: what was "uploaded" and what got deleted.
const bucket = new Map<string, { size: number; contentType?: string; checksumSha256?: string }>();
const deleted: string[] = [];
vi.mock("./r2", () => ({
  presignUpload: vi.fn(async ({ key }: { key: string }) => ({ url: `https://r2.test/${key}`, headers: {} })),
  headObject: vi.fn(async (key: string) => bucket.get(key) ?? null),
  deleteObject: vi.fn(async (key: string) => {
    deleted.push(key);
    bucket.delete(key);
  }),
  mediaPublicUrl: (key: string) => `https://img.test/${key}`,
  isR2Configured: vi.fn(() => true),
  R2NotConfiguredError: class R2NotConfiguredError extends Error {},
}));

const { db } = await import("../db");
const { isLocalDatabase } = await import("../is-local-database");
const { MediaInUseError, UploadVerificationError, deleteMedia, listMedia, registerUpload, requestUpload } = await import("./library");
const { hexToBase64, mediaKey } = await import("./rules");
const { R2NotConfiguredError, isR2Configured } = await import("./r2");

const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase ? "media library" : "media library (skipped: DATABASE_URL is not the local docker database)";
const run = Date.now().toString(16).padStart(12, "0");
const hash = (n: number) => `${run}${n.toString(16).padStart(52, "0")}`.slice(0, 64);

describe.skipIf(!runAgainstDatabase)(title, () => {
  beforeEach(() => {
    bucket.clear();
    deleted.length = 0;
  });

  afterAll(async () => {
    await db.post.deleteMany({ where: { slug: { startsWith: `media-usage-${run}` } } });
    await db.mediaFile.deleteMany({ where: { sha256: { startsWith: run } } });
  });

  async function registerImage(n: number) {
    const sha256 = hash(n);
    bucket.set(mediaKey(sha256, "image/png"), { size: 10, contentType: "image/png", checksumSha256: hexToBase64(sha256) });
    return registerUpload({ sha256, contentType: "image/png", name: `usage-${n}.png` }, "user-1");
  }

  const createPost = (name: string, data: { coverImageUrl?: string; content?: string }) =>
    db.post.create({
      data: {
        locale: "es",
        title: `Post ${name} ${run}`,
        slug: `media-usage-${run}-${name}`,
        excerpt: "Resumen.",
        content: data.content ?? "<p>Texto.</p>",
        coverImageUrl: data.coverImageUrl ?? null,
      },
      select: { id: true, title: true },
    });

  it("asks for an upload for a new image and reuses one already in the library", async () => {
    const sha256 = hash(1);
    const first = await requestUpload({ sha256, size: 10, contentType: "image/png", name: "a.png" });
    expect(first.status).toBe("upload");

    bucket.set(mediaKey(sha256, "image/png"), { size: 10, contentType: "image/png", checksumSha256: hexToBase64(sha256) });
    const media = await registerUpload({ sha256, contentType: "image/png", name: "a.png" }, "user-1");
    expect(media.url).toBe(`https://img.test/media/${sha256}.png`);

    const second = await requestUpload({ sha256, size: 10, contentType: "image/png", name: "copia.png" });
    expect(second).toMatchObject({ status: "existing", media: { id: media.id } });
    expect(await db.mediaFile.count({ where: { sha256 } })).toBe(1);
  });

  it("refuses to register an upload that never reached R2", async () => {
    await expect(registerUpload({ sha256: hash(2), contentType: "image/png", name: "b.png" }, "user-1")).rejects.toBeInstanceOf(
      UploadVerificationError,
    );
    expect(await db.mediaFile.count({ where: { sha256: hash(2) } })).toBe(0);
  });

  it("deletes the object and registers nothing when R2 holds a different file", async () => {
    const sha256 = hash(3);
    const key = mediaKey(sha256, "image/png");
    bucket.set(key, { size: 10, contentType: "image/png", checksumSha256: hexToBase64(hash(99)) });

    await expect(registerUpload({ sha256, contentType: "image/png", name: "c.png" }, "user-1")).rejects.toBeInstanceOf(
      UploadVerificationError,
    );
    expect(deleted).toEqual([key]);
    expect(await db.mediaFile.count({ where: { sha256 } })).toBe(0);
  });

  it("does not register a file over the size limit or with another type", async () => {
    for (const [n, stored] of [
      [4, { size: 6 * 1024 * 1024, contentType: "image/png" }],
      [5, { size: 10, contentType: "text/html" }],
    ] as const) {
      const sha256 = hash(n);
      bucket.set(mediaKey(sha256, "image/png"), { ...stored, checksumSha256: hexToBase64(sha256) });
      await expect(registerUpload({ sha256, contentType: "image/png", name: "d.png" }, "user-1")).rejects.toBeInstanceOf(
        UploadVerificationError,
      );
    }
  });

  it("blocks deleting an image in use and deletes the row and the object once it is free", async () => {
    const sha256 = hash(6);
    bucket.set(mediaKey(sha256, "image/png"), { size: 10, contentType: "image/png", checksumSha256: hexToBase64(sha256) });
    const media = await registerUpload({ sha256, contentType: "image/png", name: "e.png" }, "user-1");
    // The blog and the landing builder do not exist yet: stand in for their usage check.
    const checkedUrls: string[] = [];
    const usedByPost = async (url: string) => {
      checkedUrls.push(url);
      return ["Post: Post con imagen"];
    };

    const attempt = deleteMedia(media.id, usedByPost);
    await expect(attempt).rejects.toBeInstanceOf(MediaInUseError);
    await expect(attempt).rejects.toMatchObject({ usedIn: ["Post: Post con imagen"] });
    expect(checkedUrls).toEqual([media.url]);
    expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(1);
    expect(deleted).toEqual([]);

    await deleteMedia(media.id);
    expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(0);
    expect(deleted).toEqual([mediaKey(sha256, "image/png")]);
  });

  it("refuses to delete an image a post uses as its cover or inside its content, and deletes it once no post does", async () => {
    const cover = await registerImage(10);
    const inline = await registerImage(11);
    const coverPost = await createPost("cover", { coverImageUrl: cover.url });
    const inlinePost = await createPost("inline", { content: `<p>Texto.</p><img src="${inline.url}" alt="Captura" />` });

    for (const [media, post] of [
      [cover, coverPost],
      [inline, inlinePost],
    ] as const) {
      const attempt = deleteMedia(media.id);
      await expect(attempt).rejects.toBeInstanceOf(MediaInUseError);
      await expect(attempt).rejects.toMatchObject({ usedIn: [`Post: ${post.title}`] });
      expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(1);
    }
    expect(deleted).toEqual([]);

    await db.post.deleteMany({ where: { id: { in: [coverPost.id, inlinePost.id] } } });
    await deleteMedia(cover.id);
    await deleteMedia(inline.id);
    expect(await db.mediaFile.count({ where: { id: { in: [cover.id, inline.id] } } })).toBe(0);
    expect(deleted).toEqual([mediaKey(hash(10), "image/png"), mediaKey(hash(11), "image/png")]);
  });

  it("keeps the row when R2 is not configured, so no row ever outlives its object", async () => {
    const sha256 = hash(9);
    bucket.set(mediaKey(sha256, "image/png"), { size: 10, contentType: "image/png", checksumSha256: hexToBase64(sha256) });
    const media = await registerUpload({ sha256, contentType: "image/png", name: "f.png" }, "user-1");

    vi.mocked(isR2Configured).mockReturnValueOnce(false);
    await expect(deleteMedia(media.id)).rejects.toBeInstanceOf(R2NotConfiguredError);
    expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(1);
    expect(deleted).toEqual([]);
  });

  it("does nothing when the image no longer exists", async () => {
    await expect(deleteMedia("missing-media-id")).resolves.toBeUndefined();
    expect(deleted).toEqual([]);
  });

  it("lists the newest images first, with the page count", async () => {
    for (const n of [7, 8]) {
      const sha256 = hash(n);
      bucket.set(mediaKey(sha256, "image/png"), { size: 10, contentType: "image/png", checksumSha256: hexToBase64(sha256) });
      await registerUpload({ sha256, contentType: "image/png", name: `list-${n}.png` }, "user-1");
    }
    const { items, total, pages } = await listMedia({ page: 1, pageSize: 1 });
    expect(items).toHaveLength(1);
    expect(items[0]?.originalName).toBe("list-8.png");
    expect(pages).toBe(total);
  });
});
