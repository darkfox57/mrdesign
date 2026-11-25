import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import { CASE_LINE_LABELS, CASE_LINES } from "./lines";

describe("public line labels", () => {
  it("every line id has a label in es and en, and nothing else", () => {
    expect(Object.keys(es.Portfolio.lines).sort()).toEqual([...CASE_LINES].sort());
    expect(Object.keys(en.Portfolio.lines).sort()).toEqual([...CASE_LINES].sort());
  });

  it("the Spanish public labels match the dashboard labels", () => {
    expect(es.Portfolio.lines).toEqual(CASE_LINE_LABELS);
  });
});
