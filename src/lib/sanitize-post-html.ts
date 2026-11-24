import sanitizeHtml from "sanitize-html";

// Allowlist for blog content. Anything else (scripts, styles, classes, event handlers,
// iframes) is dropped before the HTML is stored, so pages can render it as is.
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "p", "br", "hr", "strong", "em", "blockquote",
    "ul", "ol", "li", "pre", "code", "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    th: ["scope"],
  },
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  // Layout wrappers are removed but their content stays.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  transformTags: {
    // The page renders the post title as its only h1.
    h1: "h2",
    a: (tagName, attribs) => ({
      tagName,
      attribs:
        attribs.target?.trim().toLowerCase() === "_blank"
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : attribs,
    }),
  },
};

export function sanitizePostHtml(html: string) {
  return sanitizeHtml(html, options);
}
