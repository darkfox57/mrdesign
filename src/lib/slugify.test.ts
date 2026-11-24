import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("removes accents, punctuation and case", () => {
    expect(slugify("¿Qué es la IA Conversacional?")).toBe("que-es-la-ia-conversacional");
  });

  it("handles Spanish and French letters", () => {
    expect(slugify("Niño, cœur y año")).toBe("nino-coeur-y-ano");
  });

  it("collapses separators and trims dashes", () => {
    expect(slugify("  IA -- en   la nube  ")).toBe("ia-en-la-nube");
  });

  it("caps the length without leaving a trailing dash", () => {
    const slug = slugify("palabra ".repeat(30));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});
