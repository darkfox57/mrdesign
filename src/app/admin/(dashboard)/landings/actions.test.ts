// @vitest-environment node
// createLanding when the insert itself hits a unique index (another save won the race after the
// checks): the translation slot and the slug each keep their message, and the form keeps its values.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const revalidatePath = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT ${path}`);
});
const db = { landing: { findUnique: vi.fn(), create: vi.fn() } };
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/require-permission", () => ({ requirePermission: vi.fn(async () => ({ role: "editor" })) }));
vi.mock("@/lib/db", () => ({ db }));

const { createLanding } = await import("./actions");

// The meta Prisma 7.10 with @prisma/adapter-pg gives a P2002: the index name in the driver error.
const clash = (model: string, index: string) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "7.10.1",
    meta: { modelName: model, driverAdapterError: { cause: { kind: "UniqueConstraintViolation", constraint: { index } } } },
  });

const values = { locale: "es", title: "Tiendas Shopify", slug: "tiendas-shopify", translationOf: "" };

function form() {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  return data;
}

describe("createLanding on a unique violation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.landing.findUnique.mockResolvedValue(null);
  });

  it("answers that the slug is taken when the slug index clashes", async () => {
    db.landing.create.mockRejectedValueOnce(clash("Landing", "Landing_locale_slug_key"));
    expect(await createLanding({}, form())).toEqual({ errors: ["Slug: otra landing de este idioma ya lo usa."], values });
    expect(redirect).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("answers that the translation exists when the translation slot clashes", async () => {
    db.landing.create.mockRejectedValueOnce(clash("Landing", "Landing_translationKey_locale_key"));
    expect(await createLanding({}, form())).toEqual({ errors: ["Esa landing ya tiene versión en ese idioma."], values });
  });

  it("answers that the slug is taken for any other unique index of the landing, as before", async () => {
    db.landing.create.mockRejectedValueOnce(clash("Landing", "Landing_somethingNew_key"));
    expect(await createLanding({}, form())).toEqual({ errors: ["Slug: otra landing de este idioma ya lo usa."], values });
  });

  it("still throws an error that is not a unique violation of the landing", async () => {
    db.landing.create.mockRejectedValueOnce(new Error("connection lost"));
    await expect(createLanding({}, form())).rejects.toThrow("connection lost");
  });

  it("opens the editor when the insert succeeds", async () => {
    db.landing.create.mockResolvedValueOnce({ id: "landing-1" });
    await expect(createLanding({}, form())).rejects.toThrow("NEXT_REDIRECT /admin/landings/landing-1/visual");
  });
});
