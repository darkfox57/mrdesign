// @vitest-environment node
// savePost when the write itself hits a unique index (P2002): the known indexes keep their own
// messages, any other one answers a generic form error with the typed values, never a 500.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const revalidatePath = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT ${path}`);
});
const db = {
  post: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  category: { findMany: vi.fn() },
};
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/require-permission", () => ({ requirePermission: vi.fn(async () => ({ role: "editor" })) }));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/media/library", () => ({ listMedia: vi.fn() }));

const { savePost } = await import("@/app/admin/(dashboard)/blog/editor-actions");

// The meta Prisma 7.10 with @prisma/adapter-pg gives a P2002: the index name in the driver error.
const clash = (index: string) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "7.10.1",
    meta: { modelName: "Post", driverAdapterError: { cause: { kind: "UniqueConstraintViolation", constraint: { index } } } },
  });

const typed = {
  locale: "es",
  title: "Cómo elegir una tienda online",
  slug: "elegir-tienda",
  excerpt: "Qué mirar antes de elegir.",
  content: "<p>Texto que no se puede perder.</p>",
  coverImageUrl: "",
  coverImageAlt: "",
  seoTitle: "",
  seoDescription: "",
  categoryIds: [],
};

function form(postId = "") {
  const data = new FormData();
  for (const [name, value] of Object.entries(typed)) if (typeof value === "string") data.set(name, value);
  data.set("postId", postId);
  data.set("translationOf", "");
  return data;
}

describe("savePost on a unique violation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.post.findUnique.mockResolvedValue(null);
    db.post.findFirst.mockResolvedValue(null);
    db.category.findMany.mockResolvedValue([]);
  });

  it("keeps the typed values and answers a generic form error for an index it does not know", async () => {
    db.post.create.mockRejectedValueOnce(clash("Post_externalId_key"));
    const state = await savePost({}, form());
    expect(state).toEqual({
      error: "No se pudo guardar: otro registro ya usa alguno de estos datos. Revisa el formulario y vuelve a intentarlo.",
      values: typed,
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does the same when an existing post is updated", async () => {
    db.post.findUnique.mockResolvedValueOnce({ locale: "es" });
    db.post.update.mockRejectedValueOnce(clash("Post_externalId_key"));
    const state = await savePost({}, form("post-1"));
    expect(state).toMatchObject({ error: expect.stringContaining("otro registro ya usa"), values: typed });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("keeps the specific messages for the slug and the translation slot", async () => {
    db.post.create.mockRejectedValueOnce(clash("Post_locale_slug_key"));
    expect(await savePost({}, form())).toEqual({ fieldErrors: { slug: "Ya hay un post con ese slug en este idioma." }, values: typed });
    db.post.create.mockRejectedValueOnce(clash("Post_translationKey_locale_key"));
    expect(await savePost({}, form())).toEqual({ error: "Este post ya tiene versión en ese idioma.", values: typed });
  });

  it("still throws an error that is not a unique violation", async () => {
    db.post.create.mockRejectedValueOnce(new Error("connection lost"));
    await expect(savePost({}, form())).rejects.toThrow("connection lost");
  });
});
