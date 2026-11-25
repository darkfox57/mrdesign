import { describe, expect, it } from "vitest";
import { focusAfterRemoval } from "./focus";

describe("focusAfterRemoval", () => {
  it("moves to the item that takes the removed one's place", () => {
    expect(focusAfterRemoval(["a", "b", "c"], "a")).toBe("b");
    expect(focusAfterRemoval(["a", "b", "c"], "b")).toBe("c");
  });

  it("moves back to the previous item when the last one goes", () => {
    expect(focusAfterRemoval(["a", "b", "c"], "c")).toBe("b");
  });

  it("returns null when nothing is left, so the container takes focus", () => {
    expect(focusAfterRemoval(["a"], "a")).toBeNull();
  });

  it("returns null for a key that is not in the list", () => {
    expect(focusAfterRemoval(["a", "b"], "z")).toBeNull();
  });

  it("works with numeric keys", () => {
    expect(focusAfterRemoval([1, 2, 3], 2)).toBe(3);
  });
});
