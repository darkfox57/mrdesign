// Where a post cover may come from: the image library in R2 (R2_PUBLIC_URL/media/). That is the
// host next.config.ts lets next/image load, so a cover elsewhere would break the public pages.
// Shared by the post editor and the ingest API.
export function coverPrefixes() {
  return process.env.R2_PUBLIC_URL ? [`${process.env.R2_PUBLIC_URL.replace(/\/+$/, "")}/media/`] : [];
}
