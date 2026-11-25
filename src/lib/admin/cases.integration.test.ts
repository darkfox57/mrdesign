// @vitest-environment node
// Case data access against the local database: drafts, publishing with the client's authorization,
// translations, slugs, and the library images a case uses.
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/media/r2", () => ({
  deleteObject: vi.fn(async () => {}),
  headObject: vi.fn(),
  presignUpload: vi.fn(),
  mediaPublicUrl: (key: string) => `https://img.cases.test/${key}`,
  isR2Configured: () => true,
  R2NotConfiguredError: class R2NotConfiguredError extends Error {},
}));

const LIBRARY = "https://img.cases.test";
const PREFIXES = [`${LIBRARY}/media/`];

const { db } = await import("@/lib/db");
const { isLocalDatabase } = await import("@/lib/is-local-database");
const { MediaInUseError, deleteMedia, mediaUsage } = await import("@/lib/media/library");
const { CLIENT_AUTHORIZATION_REQUIRED } = await import("./case-form");
const { saveCase, setCasePublication } = await import("./cases");
type CaseFormInput = import("./case-form").CaseFormInput;

// Writes rows: runs only against the local Docker database (docs/admin.md rule 7).
const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase ? "case data access" : "case data access (skipped: DATABASE_URL is not the local docker database)";
const run = `cases-${Date.now()}`;
// A random tail: other integration files build hashes from Date.now() too, and a file starting in
// the same millisecond would share (and clean up) these rows.
const mediaRun = `${Date.now().toString(16).padStart(12, "0")}${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
const hash = (n: number) => `${mediaRun}${n.toString(16).padStart(64 - mediaRun.length, "0")}`;
const imageUrl = (n: number) => `${LIBRARY}/media/${hash(n)}.png`;
const libraryImage = (n: number) =>
  db.mediaFile.create({
    data: { sha256: hash(n), key: `media/${hash(n)}.png`, url: imageUrl(n), contentType: "image/png", size: 10, originalName: `${n}.png` },
    select: { id: true, url: true },
  });

const draftInput = (name: string, extra: Partial<CaseFormInput> = {}): CaseFormInput => ({
  locale: "es",
  title: "",
  client: `Cliente ${name}`,
  year: "",
  slug: `${run}-${name}`,
  lines: [],
  summary: "",
  challenge: "",
  solution: "",
  result: "",
  metrics: [],
  stack: "",
  websiteUrl: "",
  coverImageUrl: "",
  coverImageAlt: "",
  gallery: [],
  clientAuthorized: false,
  featured: false,
  sortOrder: "",
  seoTitle: "",
  seoDescription: "",
  ...extra,
});

const completeInput = (name: string, cover: string, extra: Partial<CaseFormInput> = {}) =>
  draftInput(name, {
    title: `Caso ${name}`,
    lines: ["websites"],
    summary: "Resumen.",
    challenge: "Reto.",
    solution: "Solución.",
    result: "Resultado.",
    coverImageUrl: cover,
    coverImageAlt: "Portada",
    clientAuthorized: true,
    ...extra,
  });

// An edit sends the version (updatedAt) the editor loaded; by default the current one, as a fresh editor would.
const currentVersion = async (id: string) => (await db.case.findUnique({ where: { id }, select: { updatedAt: true } }))?.updatedAt ?? null;
const save = async (
  input: CaseFormInput,
  options: { caseId?: string; translationOf?: string; intent?: "save" | "publish"; version?: Date | null } = {},
) =>
  saveCase({
    caseId: options.caseId ?? null,
    translationOf: options.translationOf ?? null,
    version: options.version !== undefined ? options.version : options.caseId ? await currentVersion(options.caseId) : null,
    input,
    intent: options.intent ?? "save",
    libraryPrefixes: PREFIXES,
  });
const CHANGED_MEANWHILE = "El caso cambió mientras lo editabas. Recarga la página y vuelve a intentarlo.";

const created = async (input: CaseFormInput, options: Parameters<typeof save>[1] = {}) => {
  const result = await save(input, options);
  if (!result.ok) throw new Error(`expected a saved case, got ${JSON.stringify(result)}`);
  return result.id;
};

describe.skipIf(!runAgainstDatabase)(title, () => {
  afterAll(async () => {
    await db.case.deleteMany({ where: { slug: { startsWith: run } } });
    await db.mediaFile.deleteMany({ where: { sha256: { startsWith: mediaRun } } });
  });

  it("creates a draft with empty text fields, updates it and keeps its language", async () => {
    const id = await created(draftInput("draft"));
    expect(await db.case.findUnique({ where: { id } })).toMatchObject({ status: "DRAFT", summary: "", lines: [], clientAuthorized: false, publishedAt: null });

    const updated = await save(draftInput("draft", { locale: "en", summary: "Nuevo resumen.", lines: ["apps"], metrics: [{ label: "L", value: "V", source: "S" }] }), { caseId: id });
    expect(updated).toEqual({ ok: true, id, created: false });
    expect(await db.case.findUnique({ where: { id } })).toMatchObject({
      locale: "es",
      summary: "Nuevo resumen.",
      lines: ["apps"],
      metrics: [{ label: "L", value: "V", source: "S" }],
      status: "DRAFT",
    });
  });

  it("refuses to publish without the client's authorization, then publishes and unpublishes", async () => {
    const cover = await libraryImage(1);
    const id = await created(completeInput("publish", cover.url, { clientAuthorized: false }));

    expect(await save(completeInput("publish", cover.url, { clientAuthorized: false }), { caseId: id, intent: "publish" })).toEqual({
      ok: false,
      fieldErrors: { clientAuthorized: CLIENT_AUTHORIZATION_REQUIRED },
    });
    expect(await setCasePublication({ caseId: id, intent: "publish", libraryPrefixes: PREFIXES })).toEqual({ ok: false, error: CLIENT_AUTHORIZATION_REQUIRED });
    expect((await db.case.findUnique({ where: { id } }))?.status).toBe("DRAFT");

    expect(await save(completeInput("publish", cover.url), { caseId: id, intent: "publish" })).toMatchObject({ ok: true });
    const published = await db.case.findUnique({ where: { id } });
    expect(published).toMatchObject({ status: "PUBLISHED", clientAuthorized: true });
    expect(published?.publishedAt).toBeInstanceOf(Date);

    // A published case keeps the publishing rules: removing the authorization is refused.
    expect(await save(completeInput("publish", cover.url, { clientAuthorized: false }), { caseId: id })).toEqual({
      ok: false,
      fieldErrors: { clientAuthorized: CLIENT_AUTHORIZATION_REQUIRED },
    });

    expect(await setCasePublication({ caseId: id, intent: "unpublish", libraryPrefixes: PREFIXES })).toEqual({ ok: true, message: "Pasado a borrador." });
    const unpublished = await db.case.findUnique({ where: { id } });
    expect(unpublished).toMatchObject({ status: "DRAFT", publishedAt: published?.publishedAt });

    expect(await setCasePublication({ caseId: id, intent: "publish", libraryPrefixes: PREFIXES })).toEqual({ ok: true, message: "Publicado." });
    // Publishing again keeps the first publication date.
    expect(await db.case.findUnique({ where: { id } })).toMatchObject({ status: "PUBLISHED", publishedAt: published?.publishedAt });
  });

  it("lists what is missing when the list publishes an incomplete case", async () => {
    const id = await created(draftInput("incomplete", { clientAuthorized: true }));
    const result = await setCasePublication({ caseId: id, intent: "publish", libraryPrefixes: PREFIXES });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/^Completa el caso antes de publicarlo\. .*Escribe el título\./);
    expect((await db.case.findUnique({ where: { id } }))?.status).toBe("DRAFT");
  });

  it("links a translation by translationKey, one version per language", async () => {
    const source = await created(draftInput("source"));
    const translation = await created(draftInput("source-en", { locale: "en" }), { translationOf: source });
    const [a, b] = await Promise.all([db.case.findUnique({ where: { id: source } }), db.case.findUnique({ where: { id: translation } })]);
    expect(b?.translationKey).toBe(a?.translationKey);
    expect(b?.locale).toBe("en");

    expect(await save(draftInput("source-en-2", { locale: "en" }), { translationOf: source })).toEqual({ ok: false, error: "Este caso ya tiene versión en ese idioma." });
    expect(await save(draftInput("source-es-2"), { translationOf: source })).toEqual({ ok: false, error: "La traducción tiene que estar en otro idioma." });
  });

  it("refuses a slug another case uses in the same language, and allows it in another", async () => {
    await created(draftInput("slug"));
    expect(await save(draftInput("slug"))).toEqual({ ok: false, fieldErrors: { slug: "Ya hay un caso con ese slug en este idioma." } });
    expect(await save(draftInput("slug", { locale: "en" }))).toMatchObject({ ok: true });
  });

  it("refuses a save from a stale editor and changes nothing", async () => {
    const id = await created(draftInput("stale"));
    const loaded = await currentVersion(id);
    expect(await save(draftInput("stale", { summary: "Primera pestaña." }), { caseId: id, version: loaded })).toMatchObject({ ok: true });
    const afterFirst = await db.case.findUniqueOrThrow({ where: { id } });
    expect(afterFirst.updatedAt.getTime()).toBeGreaterThan(loaded!.getTime());

    // The second tab still holds the version it loaded.
    expect(await save(draftInput("stale", { summary: "Segunda pestaña." }), { caseId: id, version: loaded })).toEqual({ ok: false, error: CHANGED_MEANWHILE });
    expect(await db.case.findUniqueOrThrow({ where: { id } })).toEqual(afterFirst);
  });

  it("refuses a stale publish after another tab revoked the client's authorization", async () => {
    const cover = await libraryImage(6);
    const id = await created(completeInput("revoked", cover.url));
    const loaded = await currentVersion(id);
    expect(await save(completeInput("revoked", cover.url, { clientAuthorized: false }), { caseId: id, version: loaded })).toMatchObject({ ok: true });

    expect(await save(completeInput("revoked", cover.url), { caseId: id, version: loaded, intent: "publish" })).toEqual({ ok: false, error: CHANGED_MEANWHILE });
    expect(await db.case.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: "DRAFT", clientAuthorized: false, publishedAt: null });
  });

  it("moves the version forward on a list publish, so an editor loaded before it is refused", async () => {
    const cover = await libraryImage(7);
    const id = await created(completeInput("toggle", cover.url));
    const loaded = await currentVersion(id);
    expect(await setCasePublication({ caseId: id, intent: "publish", libraryPrefixes: PREFIXES })).toEqual({ ok: true, message: "Publicado." });
    const published = await db.case.findUniqueOrThrow({ where: { id } });
    expect(published.status).toBe("PUBLISHED");
    expect(published.updatedAt.getTime()).toBeGreaterThan(loaded!.getTime());

    expect(await save(completeInput("toggle", cover.url, { summary: "Viejo." }), { caseId: id, version: loaded })).toEqual({ ok: false, error: CHANGED_MEANWHILE });
    expect(await setCasePublication({ caseId: id, intent: "unpublish", libraryPrefixes: PREFIXES })).toEqual({ ok: true, message: "Pasado a borrador." });
  });

  it("refuses an edit that sends no version", async () => {
    const id = await created(draftInput("no-version"));
    expect(await save(draftInput("no-version", { summary: "Sin versión." }), { caseId: id, version: null })).toEqual({ ok: false, error: "Acción no válida." });
    expect((await db.case.findUniqueOrThrow({ where: { id } })).summary).toBe("");
  });

  it("refuses an id that does not exist", async () => {
    expect(await save(draftInput("ghost"), { caseId: "missing-case" })).toEqual({ ok: false, error: "El caso ya no existe." });
    expect(await setCasePublication({ caseId: "missing-case", intent: "publish", libraryPrefixes: PREFIXES })).toEqual({
      ok: false,
      error: "El caso ya no existe. Recarga la página.",
    });
  });

  it("refuses to save a cover or gallery image that is not in the library", async () => {
    const result = await save(draftInput("missing-media", { coverImageUrl: imageUrl(90), gallery: [{ url: imageUrl(91), alt: "G" }] }));
    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        coverImageUrl: "La portada no está en la biblioteca de imágenes: puede que la hayan borrado. Elige otra.",
        gallery: "Una imagen de la galería no está en la biblioteca: puede que la hayan borrado. Quítala o elige otra.",
      },
    });
    expect(await db.case.count({ where: { slug: `${run}-missing-media` } })).toBe(0);
  });

  it("makes a delete wait for a case save holding its image, then refuses the delete as in use", async () => {
    const image = await libraryImage(2);
    let releaseSave!: () => void;
    const saveHolds = new Promise<void>((resolve) => (releaseSave = resolve));
    let saveLocked!: () => void;
    const locked = new Promise<void>((resolve) => (saveLocked = resolve));

    // The save holds the image's lock (FOR KEY SHARE) while the delete starts.
    const { withLibraryImages } = await import("@/lib/media/references");
    const holding = withLibraryImages([image.url], PREFIXES, async (tx) => {
      saveLocked();
      await saveHolds;
      return tx.case.create({ data: { locale: "es", slug: `${run}-lock`, title: "Caso con bloqueo", client: "C", summary: "", challenge: "", solution: "", result: "", gallery: [{ url: image.url, alt: "G" }] } });
    });
    await locked;
    const deleting = deleteMedia(image.id);
    await new Promise((resolve) => setTimeout(resolve, 200));
    releaseSave();
    await holding;
    await expect(deleting).rejects.toBeInstanceOf(MediaInUseError);
    expect(await db.mediaFile.count({ where: { id: image.id } })).toBe(1);
  });

  it("reports an image a case uses as its cover or in its gallery, and frees it once no case does", async () => {
    const cover = await libraryImage(3);
    const inGallery = await libraryImage(4);
    const coverCase = await created(completeInput("usage-cover", cover.url, { title: `Caso portada ${run}` }));
    const galleryCase = await created(draftInput("usage-gallery", { title: `Caso galería ${run}`, gallery: [{ url: inGallery.url, alt: "G" }] }));

    expect(await mediaUsage(cover.url)).toEqual([`Caso: Caso portada ${run}`]);
    expect(await mediaUsage(inGallery.url)).toEqual([`Caso: Caso galería ${run}`]);
    const attempt = deleteMedia(inGallery.id);
    await expect(attempt).rejects.toBeInstanceOf(MediaInUseError);
    await expect(attempt).rejects.toMatchObject({ usedIn: [`Caso: Caso galería ${run}`] });

    await db.case.deleteMany({ where: { id: { in: [coverCase, galleryCase] } } });
    expect(await mediaUsage(cover.url)).toEqual([]);
    await deleteMedia(inGallery.id);
    expect(await db.mediaFile.count({ where: { id: inGallery.id } })).toBe(0);
  });

  it("names a case without a headline by its client", async () => {
    const image = await libraryImage(5);
    await created(draftInput("usage-client", { client: `Marca ${run}`, coverImageUrl: image.url }));
    expect(await mediaUsage(image.url)).toEqual([`Caso: Marca ${run}`]);
  });
});
