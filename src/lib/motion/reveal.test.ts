import { describe, expect, it } from "vitest";
import { startsBelowFold } from "./reveal";

describe("startsBelowFold", () => {
  it("hides only what starts at or below the bottom of the viewport", () => {
    expect(startsBelowFold(900, 900)).toBe(true);
    expect(startsBelowFold(1400, 900)).toBe(true);
  });

  it("keeps the server render for anything already partly on screen", () => {
    expect(startsBelowFold(899, 900)).toBe(false);
    expect(startsBelowFold(850, 900)).toBe(false);
    expect(startsBelowFold(0, 900)).toBe(false);
    expect(startsBelowFold(-200, 900)).toBe(false);
  });
});
