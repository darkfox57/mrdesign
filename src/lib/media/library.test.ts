// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Every step of a delete, in the order it happened: the test asserts the ordering, not just the outcome.
const steps: string[] = [];
const rows = new Map<string, { key: string; url: string }>();

vi.mock("../db", () => {
  const mediaFile = {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null),
    deleteMany: vi.fn(async ({ where }: { where: { id: string } }) => {
      steps.push(`row:${where.id}`);
      return { count: rows.delete(where.id) ? 1 : 0 };
    }),
    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      steps.push(`row:${where.id}`);
      rows.delete(where.id);
    }),
  };
  // The row lock of deleteMedia: answers the row while it exists.
  const tx = {
    mediaFile,
    $queryRaw: vi.fn(async (_: TemplateStringsArray, id: string) => (rows.has(id) ? [{ id }] : [])),
  };
  // A failed transaction rolls back: the row is restored as it was.
  const $transaction = vi.fn(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = new Map(rows);
    try {
      return await run(tx);
    } catch (error) {
      rows.clear();
      for (const [id, row] of before) rows.set(id, row);
      throw error;
    }
  });
  return { db: { mediaFile, $transaction } };
});

vi.mock("./r2", () => ({
  deleteObject: vi.fn(async (key: string) => {
    steps.push(`object:${key}`);
  }),
  headObject: vi.fn(),
  presignUpload: vi.fn(),
  mediaPublicUrl: (key: string) => `https://img.test/${key}`,
  isR2Configured: () => true,
  R2NotConfiguredError: class R2NotConfiguredError extends Error {},
}));

const { deleteObject } = await import("./r2");
const { MediaNotFoundError, MediaStorageError, deleteMedia } = await import("./library");

const unused = async () => [];

describe("deleteMedia", () => {
  beforeEach(() => {
    steps.length = 0;
    rows.clear();
    rows.set("m1", { key: "media/a.png", url: "https://img.test/media/a.png" });
  });

  it("deletes the object before the row, so a failure in between never loses the row", async () => {
    await deleteMedia("m1", unused);
    expect(steps).toEqual(["object:media/a.png", "row:m1"]);
    expect(rows.has("m1")).toBe(false);
  });

  it("keeps the row and reports a storage error when R2 fails to delete the object", async () => {
    const outage = new Error("503 Service Unavailable");
    vi.mocked(deleteObject).mockRejectedValueOnce(outage);

    const attempt = deleteMedia("m1", unused);
    await expect(attempt).rejects.toBeInstanceOf(MediaStorageError);
    await expect(attempt).rejects.toMatchObject({ cause: outage });
    expect(rows.has("m1")).toBe(true);
    expect(steps).toEqual([]);

    // Deleting again finishes the job: the row still holds the key.
    await deleteMedia("m1", unused);
    expect(rows.has("m1")).toBe(false);
  });

  it("reports an image that no longer exists instead of a silent success", async () => {
    await expect(deleteMedia("missing", unused)).rejects.toBeInstanceOf(MediaNotFoundError);
    expect(steps).toEqual([]);
  });
});
