import { describe, expect, it } from "vitest";
import { publicCasePaths } from "./paths";

describe("publicCasePaths", () => {
  // revalidatePath needs the route the proxy rewrites to (src/app/[locale]/...), so Spanish carries
  // its prefix and English keeps the Spanish folder name.
  it("refreshes the home page of every locale", () => {
    expect(publicCasePaths()).toEqual(expect.arrayContaining([
      { path: "/es", type: "page" },
      { path: "/en", type: "page" },
    ]));
  });

  // As a layout, the portfolio path covers the index and every case page under it, whatever the
  // slug: the new one, the old one after a rename, and the translations that link to it.
  it("refreshes the portfolio index and every case page of every locale", () => {
    expect(publicCasePaths()).toEqual(expect.arrayContaining([
      { path: "/es/portafolio", type: "layout" },
      { path: "/en/portafolio", type: "layout" },
    ]));
    expect(publicCasePaths()).toHaveLength(4);
  });
});
