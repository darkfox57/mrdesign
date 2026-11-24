// @vitest-environment node
// savePost against an image delete of the library (S9): the post is never stored pointing at an
// image whose delete went through, and a save with no library image works as before.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const revalidatePath = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT ${path}`);
});
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/require-permission", () => ({ requirePermission: vi.fn(async () => ({ role: "editor" })) }));
// In-memory stand-in for R2, for the delete.
vi.mock("@/lib/media/r2", () => ({
  deleteObject: vi.fn(async () => {}),
  headObject: vi.fn(),
  presignUpload: vi.fn(),
  mediaPublicUrl: (key: string) => `https://img.editor-actions.test/${key}`,
  isR2Configured: () => true,
  R2NotConfiguredError: class R2NotConfiguredError extends Error {},
}));

const LIBRARY = "https://img.editor-actions.test";
process.env.R2_PUBLIC_URL = LIBRARY;

const { db } = await import("@/lib/db");
const { isLocalDatabase } = await import("@/lib/is-local-database");
const { deleteMedia, mediaUsage } = await import("@/lib/media/library");
const { savePost } = await import("./editor-actions");

// Writes rows: runs only against the local Docker database (docs/admin.md rule 7).
const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase ? "savePost and library images" : "savePost and library images (skipped: DATABASE_URL is not the local docker database)";
const run = `editor-actions-${Date.now()}`;
const mediaRun = Date.now().toString(16).padStart(12, "0");
const hash = (n: number) => `${mediaRun}${n.toString(16).padStart(52, "0")}`.slice(0, 64);
const imageUrl = (n: number) => `${LIBRARY}/media/${hash(n)}.png`;
const libraryImage = (n: number) =>
  db.mediaFile.create({
    data: { sha256: hash(n), key: `media/${hash(n)}.png`, url: imageUrl(n), contentType: "image/png", size: 10, originalName: `${n}.png` },
    select: { id: true, url: true },
  });

const MISSING_COVER = "La portada no está en la biblioteca de imágenes: puede que la hayan borrado. Elige otra.";
const missingImage = (url: string) => `La imagen ${url} no está en la biblioteca de imágenes: puede que la hayan borrado. Quítala o elige otra.`;

const typed = (name: string, extra: { content?: string; coverImageUrl?: string } = {}) => ({
  locale: "es",
  title: `Post ${name}`,
  slug: `${run}-${name}`,
  excerpt: "Resumen.",
  content: extra.content ?? "<p>Texto que no se puede perder.</p>",
  coverImageUrl: extra.coverImageUrl ?? "",
  coverImageAlt: "",
  seoTitle: "",
  seoDescription: "",
  categoryIds: [] as string[],
});

function form(values: ReturnType<typeof typed>, postId = "") {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) if (typeof value === "string") data.set(name, value);
  data.set("postId", postId);
  data.set("translationOf", "");
  return data;
}

async function existingPost(name: string) {
  return db.post.create({
    data: { locale: "es", title: `Post ${name}`, slug: `${run}-${name}`, excerpt: "Resumen.", content: "<p>Antes.</p>" },
    select: { id: true },
  });
}

const stored = (id: string) => db.post.findUniqueOrThrow({ where: { id }, select: { content: true, coverImageUrl: true } });

describe.skipIf(!runAgainstDatabase)(title, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await db.post.deleteMany({ where: { slug: { startsWith: run } } });
    await db.mediaFile.deleteMany({ where: { sha256: { startsWith: mediaRun } } });
  });

  it("refuses a save whose cover or content image is no longer in the library, keeps the typed values and stores nothing", async () => {
    const post = await existingPost("borrada");
    const values = typed("borrada", { coverImageUrl: imageUrl(1), content: `<p>Hola.</p><img src="${imageUrl(2)}" alt="x" />` });
    const state = await savePost({}, form(values, post.id));
    expect(state).toEqual({ fieldErrors: { coverImageUrl: MISSING_COVER, content: missingImage(imageUrl(2)) }, values });
    expect(await stored(post.id)).toEqual({ content: "<p>Antes.</p>", coverImageUrl: null });
    expect(revalidatePath).not.toHaveBeenCalled();

    const created = await savePost({}, form(typed("nueva-borrada", { coverImageUrl: imageUrl(1) })));
    expect(created).toMatchObject({ fieldErrors: { coverImageUrl: MISSING_COVER } });
    expect(await db.post.count({ where: { slug: `${run}-nueva-borrada` } })).toBe(0);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("never stores a post pointing at an image whose delete went through at the same time", async () => {
    const media = await libraryImage(3);
    const post = await existingPost("carrera");
    let save: Promise<unknown> = Promise.resolve();
    // The usage as the delete's check read it; the save runs before the check answers.
    const usageThenSave = async (url: string) => {
      const before = await mediaUsage(url);
      save = savePost({}, form(typed("carrera", { coverImageUrl: url }), post.id));
      await new Promise((resolve) => setTimeout(resolve, 300));
      return before;
    };

    await deleteMedia(media.id, usageThenSave);
    expect(await save).toMatchObject({ fieldErrors: { coverImageUrl: MISSING_COVER } });
    expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(0);
    expect((await stored(post.id)).coverImageUrl).toBeNull();
  });

  it("saves a post with library images that exist, and one with only outside images or none, as before", async () => {
    const media = await libraryImage(4);
    const post = await existingPost("viva");
    const content = `<p>Hola.</p><img src="${media.url}" alt="x" /><img src="https://example.com/a.png" alt="y" />`;
    expect(await savePost({}, form(typed("viva", { coverImageUrl: media.url, content }), post.id))).toEqual({ ok: "Guardado." });
    expect(await stored(post.id)).toMatchObject({ coverImageUrl: media.url });
    expect((await stored(post.id)).content).toContain(media.url);

    await expect(savePost({}, form(typed("sin-imagenes")))).rejects.toThrow("NEXT_REDIRECT");
    const created = await db.post.findFirstOrThrow({ where: { slug: `${run}-sin-imagenes` }, select: { id: true, status: true } });
    expect(created.status).toBe("DRAFT");
    expect(redirect).toHaveBeenCalledWith(`/admin/blog/${created.id}`);
  });
});
