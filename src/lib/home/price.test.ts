import { describe, expect, it } from "vitest";
import { formatPrice } from "./price";

describe("formatPrice", () => {
  it("writes Colombian pesos the Colombian way in Spanish", () => {
    expect(formatPrice(420_000, "es")).toBe("$ 420.000");
    expect(formatPrice(1_260_000, "es")).toBe("$ 1.260.000");
  });

  it("names the currency in English, with English digit grouping", () => {
    expect(formatPrice(420_000, "en")).toBe("COP 420,000");
  });
});
