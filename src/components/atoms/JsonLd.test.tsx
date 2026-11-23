import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("escapes < so content cannot close the script tag", () => {
    const { container } = render(<JsonLd data={{ name: "</script><script>alert(1)</script>" }} />);
    const html = container.innerHTML;
    expect(html).not.toContain("</script><script>");
    expect(html).toContain("\\u003c/script>");
    const script = container.querySelector("script")!;
    expect(JSON.parse(script.textContent!)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
