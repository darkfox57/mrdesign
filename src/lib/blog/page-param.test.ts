import { describe, expect, it } from "vitest";
import { parsePage } from "./page-param";

describe("parsePage", () => {
  it("is the first page when the parameter is missing", () => {
    expect(parsePage(undefined)).toBe(1);
  });

  it("accepts canonical positive integers", () => {
    expect(parsePage("1")).toBe(1);
    expect(parsePage("12")).toBe(12);
    expect(parsePage(["3", "4"])).toBe(3);
  });

  it.each(["0", "-1", "1.5", "1e1", "0x2", " 2", "02", "abc", "", "1000000"])("rejects %j", (value) => {
    expect(parsePage(value)).toBeNull();
  });
});
