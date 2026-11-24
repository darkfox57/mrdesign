// @vitest-environment node
// createLanding with a translation copies the source's blocks: an image the copy uses must still
// be in the library when the new landing is stored (a delete of it may be committing meanwhile).
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const revalidatePath = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT ${path}`);
});
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/require-permission", () => ({ requirePermission: vi.fn(async () => ({ role: "editor" })) }));

const LIBRARY = "https://img.create.test";
process.env.R2_PUBLIC_URL = LIBRARY;

const { db } = await import("@/lib/db");
const { isLocalDatabase } = await import("@/lib/is-local-database");
const { createLanding } = await import("./actions");

// Writes rows: runs only against the local Docker database (docs/admin.md rule 7).
const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase ? "createLanding translations and library images" : "createLanding (skipped: DATABASE_URL is not the local docker database)";
const run = `create-${Date.now()}`;
const mediaRun = Date.now().toString(16).padStart(12, "0");
const hash = (n: number) => `${mediaRun}${n.toString(16).padStart(52, "0")}`.slice(0, 64);

const imageUrl = (n: number) => `${LIBRARY}/media/${hash(n)}.png`;
const pageWith = (url: string) => ({
  root: { props: {} },
  content: [{ type: "TextImage", props: { id: "ti", title: "T", text: "", imageUrl: url, imageAlt: "A", imageSide: "right", background: "paper" } }],
});

async function source(name: string, url: string) {
  return db.landing.create({
    data: { locale: "es", slug: `${run}-${name}`, title: `Origen ${name}`, blocks: pageWith(url) as Prisma.InputJsonValue },
    select: { id: true, translationKey: true },
  });
}

function form(translationOf: string, slug: string) {
  const data = new FormData();
  for (const [name, value] of Object.entries({ locale: "en", title: "Translated", slug, translationOf })) data.set(name, value);
  return data;
}

describe.skipIf(!runAgainstDatabase)(title, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await db.landing.deleteMany({ where: { slug: { startsWith: run } } });
    await db.mediaFile.deleteMany({ where: { sha256: { startsWith: mediaRun } } });
  });

  it("refuses a translation whose copied blocks use an image no longer in the library, and creates nothing", async () => {
    const original = await source("borrada", imageUrl(1));
    const state = await createLanding({}, form(original.id, `${run}-borrada-en`));
    expect(state).toEqual({
      errors: [`La imagen o el enlace ${imageUrl(1)}: la landing original lo usa, pero no está en la biblioteca (puede que la hayan borrado). Quítalo de la original o cámbialo.`],
      values: { locale: "en", title: "Translated", slug: `${run}-borrada-en`, translationOf: original.id },
    });
    expect(await db.landing.count({ where: { translationKey: original.translationKey, locale: "en" } })).toBe(0);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("refuses a translation whose copied Button links to an image no longer in the library", async () => {
    const original = await db.landing.create({
      data: {
        locale: "es",
        slug: `${run}-enlace`,
        title: "Origen enlace",
        blocks: { root: { props: {} }, content: [{ type: "Button", props: { id: "b1", label: "Ver", href: imageUrl(3), variant: "primary", align: "left" } }] },
      },
      select: { id: true, translationKey: true },
    });
    const state = await createLanding({}, form(original.id, `${run}-enlace-en`));
    expect(state).toMatchObject({
      errors: [`La imagen o el enlace ${imageUrl(3)}: la landing original lo usa, pero no está en la biblioteca (puede que la hayan borrado). Quítalo de la original o cámbialo.`],
    });
    expect(await db.landing.count({ where: { translationKey: original.translationKey, locale: "en" } })).toBe(0);
  });

  it("creates the translation with the copied blocks when their images are in the library, as before", async () => {
    await db.mediaFile.create({
      data: { sha256: hash(2), key: `media/${hash(2)}.png`, url: imageUrl(2), contentType: "image/png", size: 10, originalName: "2.png" },
    });
    const original = await source("viva", imageUrl(2));
    await expect(createLanding({}, form(original.id, `${run}-viva-en`))).rejects.toThrow("NEXT_REDIRECT");
    const created = await db.landing.findFirstOrThrow({ where: { translationKey: original.translationKey, locale: "en" } });
    expect(JSON.stringify(created.draftBlocks)).toContain(imageUrl(2));
    expect(redirect).toHaveBeenCalledWith(`/admin/landings/${created.id}/visual`);
  });
});
