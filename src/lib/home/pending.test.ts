import { describe, expect, it } from "vitest";
import { sectionNumbers } from "./pending";

describe("sectionNumbers", () => {
  it("numbers the shown sections without gaps", () => {
    expect(
      sectionNumbers([
        { id: "problems", visible: true },
        { id: "services", visible: true },
        { id: "cases", visible: false },
        { id: "process", visible: true },
      ]),
    ).toEqual({ problems: "01", services: "02", process: "03" });
  });

  it("pads to two digits past nine", () => {
    const sections = Array.from({ length: 10 }, (_, index) => ({ id: `s${index}`, visible: true }));
    expect(sectionNumbers(sections).s9).toBe("10");
  });
});
