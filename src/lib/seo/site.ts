// Public origin of the site, for metadata, the sitemap, robots and structured data. Set SITE_URL
// at build time (Docker build argument) and at runtime for the pages rendered on request.
export const siteUrl = (process.env.SITE_URL ?? "https://mrdesign.agency").replace(/\/$/, "");
