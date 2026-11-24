import { describe, expect, it } from "vitest";
import { isLibraryUrl } from "./cover-prefixes";

// Built from a char code: tooling can collapse a backslash written in source.
const BACKSLASH = String.fromCharCode(92);
const prefixes = ["https://img.example.com/bucket/media/"];

describe("isLibraryUrl", () => {
  it("accepts a URL inside a library prefix", () => {
    expect(isLibraryUrl("https://img.example.com/bucket/media/2026/a.png", prefixes)).toBe(true);
    expect(isLibraryUrl("https://img.example.com/bucket/media/./a.png", prefixes)).toBe(true);
  });

  it.each([
    ["a dot-dot segment", "https://img.example.com/bucket/media/../x.png"],
    ["an encoded dot-dot segment", "https://img.example.com/bucket/media/%2e%2e/%2E%2E/x.png"],
    ["a backslash dot-dot segment", `https://img.example.com/bucket/media/..${BACKSLASH}x.png`],
    ["an encoded slash", "https://img.example.com/bucket/media/..%2Fx.png"],
    ["an encoded backslash", "https://img.example.com/bucket/media/..%5cx.png"],
    ["another host with the prefix as user info", "https://img.example.com@evil.example/bucket/media/a.png"],
    ["a host that only starts like the library", "https://img.example.com.evil.example/bucket/media/a.png"],
    ["plain http", "http://img.example.com/bucket/media/a.png"],
    ["a path outside the prefix", "https://img.example.com/bucket/other/a.png"],
    ["something that is not a URL", "not a url"],
  ])("rejects %s", (_, url) => {
    expect(isLibraryUrl(url, prefixes)).toBe(false);
  });

  it("rejects everything when there is no prefix", () => {
    expect(isLibraryUrl("https://img.example.com/bucket/media/a.png", [])).toBe(false);
  });
});
