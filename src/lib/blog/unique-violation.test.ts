import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { violatesUnique } from "./unique-violation";

const known = (code: string, meta: Record<string, unknown>) => new Prisma.PrismaClientKnownRequestError("failed", { code, clientVersion: "7.10.1", meta });

// The meta a P2002 carries with Prisma 7.10 and @prisma/adapter-pg, as captured against the local
// database: no `target`, the index name in the driver error.
const adapterClash = (table: string, index: string) =>
  known("P2002", {
    modelName: table,
    driverAdapterError: { name: "DriverAdapterError", cause: { kind: "UniqueConstraintViolation", constraint: { index }, table } },
  });

describe("violatesUnique", () => {
  it("names the unique index the driver adapter reports", () => {
    const translation = adapterClash("Post", "Post_translationKey_locale_key");
    expect(violatesUnique(translation, "Post", ["translationKey", "locale"])).toBe(true);
    expect(violatesUnique(translation, "Post", ["locale", "slug"])).toBe(false);
    expect(violatesUnique(adapterClash("Post", "Post_locale_slug_key"), "Post", ["locale", "slug"])).toBe(true);
  });

  it("matches any unique index of the model when no fields are given", () => {
    expect(violatesUnique(adapterClash("Tag", "Tag_locale_name_key"), "Tag")).toBe(true);
    expect(violatesUnique(adapterClash("Tag", "Tag_locale_name_key"), "Category")).toBe(false);
  });

  it("also reads the fields from a driver constraint or from meta.target", () => {
    const fields = known("P2002", { modelName: "Post", driverAdapterError: { cause: { constraint: { fields: ["translationKey", "locale"] } } } });
    expect(violatesUnique(fields, "Post", ["translationKey", "locale"])).toBe(true);
    expect(violatesUnique(known("P2002", { modelName: "Post", target: ["locale", "slug"] }), "Post", ["locale", "slug"])).toBe(true);
  });

  it("ignores other errors", () => {
    expect(violatesUnique(known("P2025", { modelName: "Post" }), "Post")).toBe(false);
    expect(violatesUnique(new Error("Post_locale_slug_key"), "Post")).toBe(false);
  });
});
