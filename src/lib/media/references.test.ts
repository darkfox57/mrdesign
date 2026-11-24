// @vitest-environment node
import { describe, expect, it } from "vitest";
import { libraryReferences, postHtmlUrls } from "./references";

const PREFIXES = ["https://img.test/bucket/media/"];
const A = "https://img.test/bucket/media/aaa.png";
const B = "https://img.test/bucket/media/bbb.png";

describe("libraryReferences", () => {
  it("keeps library images once each, in a stable order, and leaves everything else out", () => {
    expect(libraryReferences([B, "https://example.com/a.png", A, null, "", undefined, B], PREFIXES)).toEqual([A, B]);
  });

  it("treats every library address as a reference, variants included, so the lock refuses what has no row", () => {
    const variant = "https://img.test/bucket/media/sub/../aaa.png";
    expect(libraryReferences([variant], PREFIXES)).toEqual([variant]);
  });

  it("finds nothing without library prefixes (R2 not configured)", () => {
    expect(libraryReferences([A], [])).toEqual([]);
  });
});

describe("postHtmlUrls", () => {
  it("reads the src and href values of sanitized post HTML", () => {
    const html = `<p>Texto ${B}</p><img src="${A}" alt="x" /><a href="https://example.com/" target="_blank">enlace</a>`;
    expect(postHtmlUrls(html)).toEqual([A, "https://example.com/"]);
  });
});
