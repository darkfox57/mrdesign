import { describe, expect, it } from "vitest";
import { sanitizePostHtml } from "./sanitize-post-html";

describe("sanitizePostHtml", () => {
  it("keeps the formatting posts use", () => {
    const html = "<h2>Título</h2><p>Texto <strong>fuerte</strong> y <em>énfasis</em></p><ul><li>uno</li></ul><pre><code>x = 1</code></pre>";
    expect(sanitizePostHtml(html)).toBe(html);
  });

  it("removes scripts and event handlers", () => {
    const out = sanitizePostHtml('<p onclick="steal()">hola</p><script>alert(1)</script><img src="https://x.com/a.png" onerror="steal()">');
    expect(out).not.toMatch(/script|onclick|onerror|steal/);
    expect(out).toContain("<p>hola</p>");
  });

  it("drops javascript: links and keeps https ones safe", () => {
    expect(sanitizePostHtml('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(sanitizePostHtml('<a href="https://mrdesign.agency" target="_blank">x</a>')).toBe(
      '<a href="https://mrdesign.agency" target="_blank" rel="noopener noreferrer">x</a>',
    );
  });

  it("adds rel noopener to target _blank in any case or spacing", () => {
    expect(sanitizePostHtml('<a href="https://x.com" target=" _BLANK ">x</a>')).toContain('rel="noopener noreferrer"');
  });

  it("only allows https images", () => {
    expect(sanitizePostHtml('<img src="http://x.com/a.png" alt="a">')).toBe('<img alt="a" />');
    expect(sanitizePostHtml('<img src="https://res.cloudinary.com/a.png" alt="a">')).toBe(
      '<img src="https://res.cloudinary.com/a.png" alt="a" />',
    );
  });

  it("turns h1 into h2 because the page owns the h1", () => {
    expect(sanitizePostHtml("<h1>Hola</h1>")).toBe("<h2>Hola</h2>");
  });

  it("unwraps layout containers and strips styles and classes", () => {
    expect(sanitizePostHtml('<article><div class="x"><p style="color:red">hola</p></div></article>')).toBe("<p>hola</p>");
  });
});
