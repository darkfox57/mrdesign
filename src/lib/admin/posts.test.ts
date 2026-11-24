import { describe, expect, it } from "vitest";
import { postListFilterSchema, publicBlogPaths, publicationChange } from "./posts";

describe("publicationChange", () => {
  const now = new Date("2026-11-09T12:00:00Z");

  it("publishes with today's date when the post was never published", () => {
    expect(publicationChange("publish", null, now)).toEqual({ status: "PUBLISHED", publishedAt: now });
  });

  it("keeps the date of a post that was published before", () => {
    const original = new Date("2024-03-10T00:00:00Z");
    expect(publicationChange("publish", original, now)).toEqual({ status: "PUBLISHED", publishedAt: original });
  });

  it("moves a post back to draft and keeps its date for a later publish", () => {
    const original = new Date("2024-03-10T00:00:00Z");
    expect(publicationChange("unpublish", original, now)).toEqual({ status: "DRAFT", publishedAt: original });
  });
});

describe("postListFilterSchema", () => {
  it("accepts known statuses and locales and defaults to all and page 1", () => {
    expect(postListFilterSchema.parse({})).toEqual({ status: undefined, locale: undefined, page: 1 });
    expect(postListFilterSchema.parse({ status: "DRAFT", locale: "en", page: "3" })).toEqual({
      status: "DRAFT",
      locale: "en",
      page: 3,
    });
  });

  it("ignores unknown values instead of failing the page", () => {
    expect(postListFilterSchema.parse({ status: "DELETED", locale: "fr", page: "-2" })).toEqual({
      status: undefined,
      locale: undefined,
      page: 1,
    });
  });
});

describe("publicBlogPaths", () => {
  // revalidatePath needs the route the proxy rewrites to (src/app/[locale]/blog), so Spanish
  // carries its prefix here even though its public URL has none.
  it("returns the blog route of every locale, which covers the index, the posts and the categories", () => {
    expect(publicBlogPaths()).toEqual(["/es/blog", "/en/blog"]);
  });
});
