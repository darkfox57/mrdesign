import { describe, expect, it } from "vitest";
import { collectPageStrings } from "./images";

describe("collectPageStrings", () => {
  it("finds every string of the page: root props, block props, item lists and slots at any depth", () => {
    const page = {
      root: { props: { title: "Landing", slug: "landing" } },
      content: [
        { type: "Hero", props: { id: "h", primaryHref: "https://img.test/media/a.png", items: [{ text: "uno" }] } },
        { type: "Columns", props: { id: "c", left: [{ type: "Button", props: { id: "b", href: "https://img.test/media/b.png", count: 3 } }], right: [] } },
      ],
    };
    const strings = collectPageStrings(page);
    expect(strings).toEqual(expect.arrayContaining(["Landing", "landing", "https://img.test/media/a.png", "uno", "https://img.test/media/b.png", "Button"]));
    expect(strings).not.toContain(3);
  });
});
