// @vitest-environment node
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// In-memory stand-in for R2: what was "uploaded" and what got deleted.
const bucket = new Map<string, { size: number; contentType?: string; checksumSha256?: string }>();
const deleted: string[] = [];
// Slows the R2 delete down, so a test can act while the delete holds its row lock and "calls R2".
let r2DelayMs = 0;
vi.mock("./r2", () => ({
  presignUpload: vi.fn(async ({ key }: { key: string }) => ({ url: `https://r2.test/${key}`, headers: {} })),
  headObject: vi.fn(async (key: string) => bucket.get(key) ?? null),
  deleteObject: vi.fn(async (key: string) => {
    if (r2DelayMs > 0) await new Promise((resolve) => setTimeout(resolve, r2DelayMs));
    deleted.push(key);
    bucket.delete(key);
  }),
  mediaPublicUrl: (key: string) => `https://img.test/${key}`,
  isR2Configured: vi.fn(() => true),
  R2NotConfiguredError: class R2NotConfiguredError extends Error {},
}));

const { db } = await import("../db");
const { isLocalDatabase } = await import("../is-local-database");
const {
  MediaInUseError,
  MediaNotFoundError,
  MediaStorageError,
  UploadVerificationError,
  deleteMedia,
  listMedia,
  mediaUsage,
  registerUpload,
  requestUpload,
  updateMediaAlt,
} = await import("./library");
const { MediaMissingError, withLibraryImages } = await import("./references");
const { saveDraft } = await import("../landings/editor");
const { hexToBase64, mediaKey } = await import("./rules");
const { R2NotConfiguredError, deleteObject, isR2Configured } = await import("./r2");

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
    await db.landing.deleteMany({ where: { slug: { startsWith: `media-usage-${run}` } } });
    await db.case.deleteMany({ where: { slug: { startsWith: `media-usage-${run}` } } });
    await db.mediaFile.deleteMany({ where: { sha256: { startsWith: run } } });
  });

  async function registerImage(n: number, uploadedById = "user-1") {
    const sha256 = hash(n);
    bucket.set(mediaKey(sha256, "image/png"), { size: 10, contentType: "image/png", checksumSha256: hexToBase64(sha256) });
    return registerUpload({ sha256, contentType: "image/png", name: `usage-${n}.png` }, uploadedById);
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

  it("refuses to delete an image a landing uses in its published blocks or its draft, nested blocks included", async () => {
    const published = await registerImage(12);
    const drafted = await registerImage(13);
    const textImage = (imageUrl: string) => ({
      type: "TextImage",
      props: { id: "ti", title: "T", text: "", imageUrl, imageAlt: "A", imageSide: "right", background: "paper" },
    });
    const columns = (imageUrl: string) => ({
      type: "Columns",
      props: { id: "cols", ratio: "1-1", background: "paper", left: [textImage(imageUrl)], right: [] },
    });
    const landings = await Promise.all([
      db.landing.create({
        data: { locale: "es", slug: `media-usage-${run}-publicada`, title: `Landing publicada ${run}`, blocks: { root: { props: {} }, content: [textImage(published.url)] } },
      }),
      db.landing.create({
        data: { locale: "es", slug: `media-usage-${run}-borrador`, title: `Landing borrador ${run}`, draftBlocks: { root: { props: {} }, content: [columns(drafted.url)] } },
      }),
    ]);

    for (const [media, landing] of [
      [published, landings[0]],
      [drafted, landings[1]],
    ] as const) {
      const attempt = deleteMedia(media.id);
      await expect(attempt).rejects.toBeInstanceOf(MediaInUseError);
      await expect(attempt).rejects.toMatchObject({ usedIn: [`Landing: ${landing.title}`] });
      expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(1);
    }
    expect(deleted).toEqual([]);

    await db.landing.deleteMany({ where: { id: { in: landings.map((landing) => landing.id) } } });
    await deleteMedia(published.id);
    await deleteMedia(drafted.id);
    expect(await db.mediaFile.count({ where: { id: { in: [published.id, drafted.id] } } })).toBe(0);
  });

  it("refuses to delete an image a case uses as its cover or in its gallery, drafts included", async () => {
    const cover = await registerImage(40);
    const inGallery = await registerImage(41);
    const caseRow = (name: string, data: { coverImageUrl?: string; gallery?: { url: string; alt: string }[] }) =>
      db.case.create({
        data: { locale: "es", slug: `media-usage-${run}-${name}`, title: `Caso ${name} ${run}`, client: "C", summary: "", challenge: "", solution: "", result: "", ...data },
      });
    const cases = await Promise.all([caseRow("portada", { coverImageUrl: cover.url }), caseRow("galeria", { gallery: [{ url: inGallery.url, alt: "G" }] })]);

    for (const [media, item] of [
      [cover, cases[0]],
      [inGallery, cases[1]],
    ] as const) {
      const attempt = deleteMedia(media.id);
      await expect(attempt).rejects.toBeInstanceOf(MediaInUseError);
      await expect(attempt).rejects.toMatchObject({ usedIn: [`Caso: ${item.title}`] });
      expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(1);
    }
    expect(deleted).toEqual([]);

    await db.case.deleteMany({ where: { id: { in: cases.map((item) => item.id) } } });
    await deleteMedia(cover.id);
    await deleteMedia(inGallery.id);
    expect(await db.mediaFile.count({ where: { id: { in: [cover.id, inGallery.id] } } })).toBe(0);
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

  it("reports an image that no longer exists instead of a silent success", async () => {
    await expect(deleteMedia("missing-media-id")).rejects.toBeInstanceOf(MediaNotFoundError);
    expect(deleted).toEqual([]);
  });

  it("keeps the row when R2 fails to delete the object", async () => {
    const media = await registerImage(14);
    vi.mocked(deleteObject).mockRejectedValueOnce(new Error("503 Service Unavailable"));

    await expect(deleteMedia(media.id)).rejects.toBeInstanceOf(MediaStorageError);
    expect(await db.mediaFile.findUnique({ where: { id: media.id }, select: { alt: true, originalName: true } })).toEqual({
      alt: "",
      originalName: "usage-14.png",
    });
  });

  describe("a delete and a save of the same image at the same time", () => {
    const prefixes = ["https://img.test/media/"];
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const outcome = (promise: Promise<unknown>) => promise.then(() => "done" as const, (error: unknown) => error);
    const settle = (promise: Promise<unknown>) => promise.then((value) => ({ value }), (error: unknown) => ({ error }));
    const storedDraft = async (id: string) => (await db.landing.findUniqueOrThrow({ where: { id }, select: { draftBlocks: true } })).draftBlocks;
    const buttonPage = (slug: string, href: string) => ({
      root: { props: { title: "Landing", slug } },
      content: [{ type: "Button", props: { id: "b1", label: "Ver", href, variant: "primary", align: "left" } }],
    });

    afterEach(() => {
      r2DelayMs = 0;
    });
    const landingPage = (slug: string, imageUrl: string) => ({
      root: { props: { title: "Landing", slug } },
      content: [{ type: "TextImage", props: { id: "ti", title: "T", text: "", imageUrl, imageAlt: "A", imageSide: "right", background: "paper" } }],
    });

    async function emptyLanding(name: string) {
      const slug = `media-usage-${run}-${name}`;
      const row = await db.landing.create({ data: { locale: "es", slug, title: `Landing ${name} ${run}` }, select: { id: true, updatedAt: true } });
      return { id: row.id, version: row.updatedAt.toISOString(), slug };
    }

    it("refuses the save when it commits while the delete checks the usage, so nothing points at the deleted image", async () => {
      const media = await registerImage(20);
      const landing = await emptyLanding("carrera");
      let save: Promise<unknown> = Promise.resolve();
      // The usage as it was when the check read it; the save runs before the check answers: the
      // window between checking and deleting.
      const usageThenSave = async (url: string) => {
        const before = await mediaUsage(url);
        save = saveDraft(landing.id, landing.version, landingPage(landing.slug, url), prefixes);
        await sleep(300);
        return before;
      };

      expect(await outcome(deleteMedia(media.id, usageThenSave))).toBe("done");
      expect(await save).toEqual({ ok: false, errors: [expect.stringContaining("no está en la biblioteca")] });
      expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(0);
      expect(deleted).toEqual([mediaKey(hash(20), "image/png")]);
      expect((await db.landing.findUniqueOrThrow({ where: { id: landing.id } })).draftBlocks).toBeNull();
    });

    it("makes the delete wait for a save holding the image, then refuses it as in use", async () => {
      const media = await registerImage(21);
      const landing = await emptyLanding("guardando");
      let deletion: Promise<unknown> = Promise.resolve();
      await withLibraryImages([media.url], prefixes, async (tx) => {
        await tx.landing.update({ where: { id: landing.id }, data: { draftBlocks: landingPage(landing.slug, media.url) } });
        deletion = outcome(deleteMedia(media.id));
        await sleep(300);
      });

      const refused = await deletion;
      expect(refused).toBeInstanceOf(MediaInUseError);
      expect(refused).toMatchObject({ usedIn: [`Landing: Landing guardando ${run}`] });
      expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(1);
      expect(deleted).toEqual([]);
    });

    // P1 to P5: the independent verifier's probes (T17 B1), kept as regression tests.
    it("refuses a draft that links to the image (a Button href) while the delete calls R2, so no link points at the deleted image", async () => {
      const media = await registerImage(30);
      const landing = await emptyLanding("boton");
      r2DelayMs = 500;
      const deletion = settle(deleteMedia(media.id));
      await sleep(150); // The delete has locked the row, found no usage and is calling R2.
      const save = await saveDraft(landing.id, landing.version, buttonPage(landing.slug, media.url), prefixes);

      expect(await deletion).toEqual({ value: undefined });
      expect(save).toEqual({ ok: false, errors: [expect.stringContaining("no está en la biblioteca")] });
      expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(0);
      expect(await storedDraft(landing.id)).toBeNull();
    });

    it("refuses a draft with the image in a TextImage under the same interleaving", async () => {
      const media = await registerImage(31);
      const landing = await emptyLanding("textimage");
      r2DelayMs = 500;
      const deletion = settle(deleteMedia(media.id));
      await sleep(150);
      const save = await saveDraft(landing.id, landing.version, landingPage(landing.slug, media.url), prefixes);

      expect(await deletion).toEqual({ value: undefined });
      expect(save).toEqual({ ok: false, errors: [expect.stringContaining("no está en la biblioteca")] });
      expect(await storedDraft(landing.id)).toBeNull();
    });

    it("leaves nothing pointing at the image when the save waits on a delete whose R2 call takes over 5 s", async () => {
      const media = await registerImage(32);
      const landing = await emptyLanding("r2-lento");
      r2DelayMs = 6500;
      const deletion = settle(deleteMedia(media.id));
      await sleep(150);
      await settle(saveDraft(landing.id, landing.version, landingPage(landing.slug, media.url), prefixes));
      await deletion;
      expect(await storedDraft(landing.id)).toBeNull();
    }, 20_000);

    it("refuses every variant of an existing image's URL and accepts the exact one", async () => {
      const media = await registerImage(33);
      const tail = media.url.replace("https://img.test/", "");
      const file = tail.replace("media/", "");
      const variants = [
        `https://IMG.TEST/${tail}`,
        `https://img.test:443/${tail}`,
        `${media.url}?v=1`,
        `${media.url}#x`,
        `https://img.test/media/sub/../${file}`,
        `https://img.test/media/%2e%2e/media/${file}`,
      ];
      for (const url of variants) {
        const result = await settle(withLibraryImages([url], prefixes, async () => "written"));
        expect("error" in result && result.error instanceof MediaMissingError, url).toBe(true);
      }
      expect(await settle(withLibraryImages([media.url], prefixes, async () => "written"))).toEqual({ value: "written" });
    });

    it("refuses two deletes while two saves hold both images, and lets both saves through without a deadlock", async () => {
      const a = await registerImage(34);
      const b = await registerImage(35);
      const landing = await emptyLanding("dos-guardados");
      const page = { root: { props: { title: "L", slug: landing.slug } }, content: [] };
      let deleteA: Promise<unknown> = Promise.resolve();
      let deleteB: Promise<unknown> = Promise.resolve();
      let saveTwo: Promise<unknown> = Promise.resolve();
      const saveOne = settle(
        withLibraryImages([b.url, a.url], prefixes, async (tx) => {
          await tx.landing.update({ where: { id: landing.id }, data: { draftBlocks: { ...page, note: `${a.url} ${b.url}` } } });
          deleteA = settle(deleteMedia(a.id));
          deleteB = settle(deleteMedia(b.id));
          await sleep(200);
          saveTwo = settle(withLibraryImages([a.url, b.url], prefixes, async () => "second"));
          await sleep(200);
          return "first";
        }),
      );

      expect(await saveOne).toEqual({ value: "first" });
      expect(await saveTwo).toEqual({ value: "second" });
      expect(((await deleteA) as { error: unknown }).error).toBeInstanceOf(MediaInUseError);
      expect(((await deleteB) as { error: unknown }).error).toBeInstanceOf(MediaInUseError);
      expect(await db.mediaFile.count({ where: { id: { in: [a.id, b.id] } } })).toBe(2);
    });

    it("lets two deletes of the same image both succeed, as before", async () => {
      const media = await registerImage(22);
      // The first one takes its time, so the second finds the row before it goes.
      const slowUsage = async (url: string) => {
        await sleep(300);
        return mediaUsage(url);
      };
      expect(await Promise.all([outcome(deleteMedia(media.id, slowUsage)), outcome(deleteMedia(media.id))])).toEqual(["done", "done"]);
      expect(await db.mediaFile.count({ where: { id: media.id } })).toBe(0);
      expect(deleted).toContain(mediaKey(hash(22), "image/png"));
    });
  });

  it("lets admins change any image's alt text and editors only the images they uploaded", async () => {
    const own = await registerImage(15, "editor-1");
    const others = await registerImage(16, "admin-1");
    const editor = { id: "editor-1", role: "editor" as const };
    const admin = { id: "admin-1", role: "admin" as const };
    const altOf = async (id: string) => (await db.mediaFile.findUnique({ where: { id }, select: { alt: true } }))?.alt;

    expect(await updateMediaAlt(own.id, "Foto propia", editor)).toBe("updated");
    expect(await altOf(own.id)).toBe("Foto propia");

    expect(await updateMediaAlt(others.id, "Cambio ajeno", editor)).toBe("forbidden");
    expect(await altOf(others.id)).toBe("");

    expect(await updateMediaAlt(own.id, "Revisado por admin", admin)).toBe("updated");
    expect(await updateMediaAlt(others.id, "Texto del admin", admin)).toBe("updated");
    expect(await altOf(own.id)).toBe("Revisado por admin");
    expect(await altOf(others.id)).toBe("Texto del admin");

    expect(await updateMediaAlt("missing-media-id", "Nada", admin)).toBe("missing");
  });

  it("lists the newest images first, with the page count, and clamps a page past the last one", async () => {
    // Explicit, far-future dates: the newest-first order does not depend on two inserts landing in different milliseconds.
    const names: string[] = [];
    for (const [offset, n] of [7, 8, 17].entries()) {
      const media = await registerImage(n);
      await db.mediaFile.update({ where: { id: media.id }, data: { createdAt: new Date(Date.UTC(2999, 0, 1, 0, 0, offset)) } });
      names.push(media.originalName);
    }

    const first = await listMedia({ page: 1, pageSize: 2 });
    expect(first.items.map((item) => item.originalName)).toEqual([names[2], names[1]]);
    expect(first.page).toBe(1);
    expect(first.pages).toBe(Math.ceil(first.total / 2));
    expect(first.pages).toBeGreaterThanOrEqual(2);

    const past = await listMedia({ page: 1_000_000_000, pageSize: 2 });
    expect(past.page).toBe(past.pages);
    expect(past.items.length).toBeGreaterThan(0);
  });
});
