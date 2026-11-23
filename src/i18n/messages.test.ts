import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import { routing } from "./routing";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
}

describe("messages", () => {
  const catalogs = { es, en };

  it("has one catalog per configured locale", () => {
    expect(Object.keys(catalogs).sort()).toEqual([...routing.locales].sort());
  });

  it("en has exactly the same keys as es", () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });

  it("has no empty strings", () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      expect(JSON.stringify(catalog), locale).not.toMatch(/:""/);
    }
  });
});
