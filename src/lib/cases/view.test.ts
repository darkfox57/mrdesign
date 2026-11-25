import { describe, expect, it } from "vitest";
import { caseGallery, caseLines, caseMetrics, casesOrEmpty, paragraphs, portfolioView } from "./view";

describe("casesOrEmpty", () => {
  it("returns the loaded cases", async () => {
    await expect(casesOrEmpty(async () => [1, 2], () => {})).resolves.toEqual([1, 2]);
  });

  it("reads a failed load as no cases and reports it, so the index falls back to the static grid", async () => {
    const reported: unknown[] = [];
    const failure = new Error("database unreachable");
    await expect(casesOrEmpty(async () => Promise.reject(failure), (error) => reported.push(error))).resolves.toEqual([]);
    expect(reported).toEqual([failure]);
  });
});

describe("caseMetrics", () => {
  it("keeps the stored metrics with their label, value and source", () => {
    const stored = [{ label: "Pedidos", value: "+30 %", source: "Informe de Shopify, 2025", extra: 1 }];
    expect(caseMetrics(stored)).toEqual([{ label: "Pedidos", value: "+30 %", source: "Informe de Shopify, 2025" }]);
  });

  it("reads a malformed column as no metrics instead of failing the page", () => {
    expect(caseMetrics(null)).toEqual([]);
    expect(caseMetrics({ label: "x" })).toEqual([]);
    expect(caseMetrics([{ label: "Pedidos", value: 30 }])).toEqual([]);
  });
});

describe("caseGallery", () => {
  it("keeps every image with its alt text", () => {
    expect(caseGallery([{ url: "https://img.test/a.png", alt: "Ficha de producto" }])).toEqual([
      { url: "https://img.test/a.png", alt: "Ficha de producto" },
    ]);
  });

  it("reads a malformed column as an empty gallery", () => {
    expect(caseGallery("nope")).toEqual([]);
    expect(caseGallery([{ url: "https://img.test/a.png" }])).toEqual([]);
  });
});

describe("caseLines", () => {
  it("keeps the known line ids in display order and drops unknown ones", () => {
    expect(caseLines(["plugins", "ecommerce", "websites"])).toEqual(["websites", "plugins"]);
  });
});

describe("paragraphs", () => {
  it("splits a text on blank lines and drops empty paragraphs", () => {
    expect(paragraphs("Primero.\n\n\nSegundo,\nen dos líneas.\n\n  ")).toEqual(["Primero.", "Segundo,\nen dos líneas."]);
  });
});

describe("portfolioView", () => {
  const project = { id: "p1" };

  it("lists the published cases when there is at least one", () => {
    expect(portfolioView([{ id: "c1" }], [project])).toEqual({ kind: "cases", cases: [{ id: "c1" }] });
  });

  it("falls back to the static project grid while no case is published", () => {
    expect(portfolioView([], [project])).toEqual({ kind: "projects", projects: [project] });
  });
});
