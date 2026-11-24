// Where a post cover may come from: the image library in R2 (R2_PUBLIC_URL/media/). That is the
// host next.config.ts lets next/image load, so a cover elsewhere would break the public pages.
// Shared by the post editor and the ingest API.
export function coverPrefixes() {
  return process.env.R2_PUBLIC_URL ? [`${process.env.R2_PUBLIC_URL.replace(/\/+$/, "")}/media/`] : [];
}

const parse = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

// Encoded "/" or "\": a CDN or the bucket may decode them into a path separator after this check.
const ENCODED_SEPARATOR = /%2f|%5c/i;

// Whether `value` points inside one of the library prefixes. The URL API resolves "..", "%2e%2e"
// and backslashes first, so `<prefix>../x.png` is checked as the path it really addresses.
// Covers and landing images both go through here.
export function isLibraryUrl(value: string, prefixes: readonly string[]): boolean {
  const url = parse(value);
  if (!url || url.username || url.password || ENCODED_SEPARATOR.test(url.pathname)) return false;
  return prefixes.some((prefix) => {
    const base = parse(prefix);
    return base !== null && url.origin === base.origin && url.pathname.startsWith(base.pathname);
  });
}
