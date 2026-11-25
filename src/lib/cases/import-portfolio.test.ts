import { describe, expect, it } from "vitest";
import { linesFromTags, portfolioCaseRows, requireExplicitDatabaseUrl } from "./import-portfolio";

describe("linesFromTags", () => {
  it("maps web to custom websites and leaves the store platform for the owner to choose", () => {
    expect(linesFromTags(["web"])).toEqual(["websites"]);
    // "ecommerce" does not say which platform the store runs on: no line is guessed.
    expect(linesFromTags(["web", "ecommerce"])).toEqual(["websites"]);
    expect(linesFromTags(["ecommerce"])).toEqual([]);
  });
});

describe("portfolioCaseRows", () => {
  it("builds one empty, unauthorized draft per language, sharing a translation key", () => {
    const rows = portfolioCaseRows({ id: "ocula-optica", name: "Ocula Óptica", image: "/portfolio/x.jpg", imageAlt: { es: "", en: "" }, tags: ["web"] });
    expect(rows.map((row) => row.locale)).toEqual(["es", "en"]);
    for (const row of rows) {
      expect(row).toMatchObject({
        slug: "ocula-optica",
        client: "Ocula Óptica",
        title: "",
        summary: "",
        challenge: "",
        solution: "",
        result: "",
        lines: ["websites"],
        clientAuthorized: false,
        status: "DRAFT",
        coverImageUrl: null,
      });
    }
  });
});

describe("requireExplicitDatabaseUrl", () => {
  it("refuses to run without DATABASE_URL in the environment", () => {
    expect(() => requireExplicitDatabaseUrl({})).toThrow("Set DATABASE_URL explicitly");
    expect(() => requireExplicitDatabaseUrl({ DATABASE_URL: " " })).toThrow("Set DATABASE_URL explicitly");
  });

  it("names the target database without its credentials", () => {
    expect(requireExplicitDatabaseUrl({ DATABASE_URL: "postgresql://user:secret@db.example:5432/site" })).toBe("db.example:5432/site");
  });
});

describe("the real portfolio", () => {
  it("gives every project a distinct, non-empty slug", async () => {
    const { projects } = await import("@/content/portfolio");
    const slugs = projects.map((project) => portfolioCaseRows(project)[0].slug);
    expect(slugs.every(Boolean)).toBe(true);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
