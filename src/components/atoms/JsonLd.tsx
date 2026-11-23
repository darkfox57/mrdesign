// Structured data for search engines. Every "<" becomes its JSON unicode escape (backslash, u003c),
// so content (post or landing titles) can never close the script tag. JSON.parse reads it back unchanged.
// The escape is built from char codes so editors and tooling cannot collapse it back into "<".
const LESS_THAN = /</g;
const ESCAPED_LESS_THAN = `${String.fromCharCode(92)}u003c`;

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(LESS_THAN, ESCAPED_LESS_THAN) }}
    />
  );
}
