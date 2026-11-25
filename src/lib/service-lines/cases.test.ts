import { describe, expect, it } from "vitest";
import { casesForLine } from "./cases";

const card = (id: string, lines: string[]) => ({ id, lines });

describe("casesForLine", () => {
  it("keeps only the cases of the line, in their order", () => {
    const cases = [card("a", ["shopify", "plugins"]), card("b", ["websites"]), card("c", ["plugins"])];
    expect(casesForLine(cases, "plugins").map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("returns nothing when no case belongs to the line", () => {
    expect(casesForLine([card("a", ["websites"])], "evolution")).toEqual([]);
    expect(casesForLine([], "websites")).toEqual([]);
  });
});
