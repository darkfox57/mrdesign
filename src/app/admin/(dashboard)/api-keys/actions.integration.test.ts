// @vitest-environment node
// revokeApiKey on the local database (rule 2), S9: revoking a key that is missing or already revoked
// tells the admin instead of silently succeeding. Only the session check and revalidation are stubbed.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { requireSession, revalidatePath } = vi.hoisted(() => ({ requireSession: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ requireSession }));

const { revokeApiKey } = await import("./actions");
const { db } = await import("@/lib/db");
const { isLocalDatabase } = await import("@/lib/is-local-database");

const local = isLocalDatabase(process.env.DATABASE_URL);
const RUN = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const NAME = `revoke-test-${RUN}`;
const ALREADY = "Esta key ya estaba revocada o no existe.";
let n = 0;

async function insertKey(revokedAt: Date | null = null) {
  const id = `revoke-test-${RUN}-${n++}`;
  await db.apiKey.create({ data: { id, name: NAME, keyHash: `hash-${id}`, prefix: "mrd_test0000", revokedAt } });
  return id;
}

function form(keyId: string) {
  const data = new FormData();
  data.set("keyId", keyId);
  return data;
}

const revokedAt = async (id: string) => (await db.apiKey.findUniqueOrThrow({ where: { id }, select: { revokedAt: true } })).revokedAt;

describe.skipIf(!local)("revokeApiKey", () => {
  afterAll(() => db.apiKey.deleteMany({ where: { name: NAME } }));
  beforeEach(() => {
    requireSession.mockReset().mockResolvedValue({ role: "admin" });
    revalidatePath.mockReset();
  });

  it("revokes an active key and revalidates the list", async () => {
    const id = await insertKey();
    expect(await revokeApiKey({}, form(id))).toEqual({});
    expect(requireSession).toHaveBeenCalledWith(["admin"]);
    expect(await revokedAt(id)).toBeInstanceOf(Date);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/api-keys");
  });

  it("tells the admin a key was already revoked, and keeps its original date", async () => {
    const original = new Date("2026-01-02T03:04:05.000Z");
    const id = await insertKey(original);
    expect(await revokeApiKey({}, form(id))).toEqual({ error: ALREADY });
    expect(await revokedAt(id)).toEqual(original);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("tells the admin when revoking the same key twice", async () => {
    const id = await insertKey();
    expect(await revokeApiKey({}, form(id))).toEqual({});
    const first = await revokedAt(id);
    revalidatePath.mockReset();
    expect(await revokeApiKey({}, form(id))).toEqual({ error: ALREADY });
    expect(await revokedAt(id)).toEqual(first);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("tells the admin when the key does not exist", async () => {
    expect(await revokeApiKey({}, form(`revoke-test-${RUN}-missing`))).toEqual({ error: ALREADY });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("still refuses an invalid id before touching the database", async () => {
    expect(await revokeApiKey({}, form(""))).toEqual({ error: "Acción no válida." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("checks the admin session first: a refused session revokes nothing", async () => {
    const id = await insertKey();
    requireSession.mockRejectedValue(new Error("NEXT_REDIRECT /admin/login"));
    await expect(revokeApiKey({}, form(id))).rejects.toThrow("NEXT_REDIRECT");
    expect(await revokedAt(id)).toBeNull();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
