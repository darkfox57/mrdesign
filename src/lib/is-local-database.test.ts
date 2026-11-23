import { describe, expect, it } from "vitest";
import { isLocalDatabase } from "./is-local-database";

describe("isLocalDatabase", () => {
  it("accepts databases on this machine", () => {
    expect(isLocalDatabase("postgresql://mrdesign:mrdesign@localhost:5434/mrdesign")).toBe(true);
    expect(isLocalDatabase("postgresql://u:p@127.0.0.1:5434/db")).toBe(true);
    expect(isLocalDatabase("postgresql://u:p@[::1]:5434/db")).toBe(true);
  });

  it("rejects remote, missing or malformed URLs", () => {
    expect(isLocalDatabase("postgresql://u:p@db.example.com:5432/db")).toBe(false);
    expect(isLocalDatabase(undefined)).toBe(false);
    expect(isLocalDatabase("not a url")).toBe(false);
  });
});
