import { describe, expect, it } from "vitest";
import { faqs } from "@/content/home";
import { sectionNumbers, withoutPending } from "./pending";

describe("withoutPending", () => {
  const items = [{ id: "a" }, { id: "b", pending: "[Confirmar]" }, { id: "c" }];

  it("drops every item with a placeholder when pending content is hidden", () => {
    expect(withoutPending(items, false).map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("keeps everything when pending content is shown", () => {
    expect(withoutPending(items, true).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("never changes the original list", () => {
    withoutPending(items, false);
    expect(items).toHaveLength(3);
  });

  it("keeps the FAQ entries whose answers are complete", () => {
    expect(withoutPending(faqs, false).every((faq) => faq.pending === undefined)).toBe(true);
    expect(withoutPending(faqs, false).length).toBeGreaterThan(0);
  });
});

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
