const columns = Array.from({ length: 12 }, (_, index) => index);

// The 12-column grid that X-ray mode lays over the page (styles in src/app/globals.css). Decorative:
// hidden from assistive technology and transparent to clicks.
export function XrayGrid() {
  return (
    <div aria-hidden="true" className="xray-grid">
      <div className="site-container">
        {columns.map((column) => (
          <span key={column} />
        ))}
      </div>
    </div>
  );
}
