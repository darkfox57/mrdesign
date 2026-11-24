// The remote images next/image may load: only the media folder (src/lib/media keys every
// upload under media/) of the public bucket URL, so the optimizer cannot serve anyone else's images.
// Used by next.config.ts, so it stays free of server-only imports.
type RemotePattern = { protocol: "http" | "https"; hostname: string; port?: string; pathname: string };

export function mediaRemotePatterns(publicUrl: string | undefined): RemotePattern[] {
  if (!publicUrl || !URL.canParse(publicUrl)) return [];
  const url = new URL(publicUrl);
  const protocol = url.protocol.slice(0, -1);
  if (protocol !== "http" && protocol !== "https") return [];
  // next/image treats "*" as a wildcard, so a crafted value could open the optimizer to any host or path.
  // A query or hash would also break the stored URLs, which append the key to this base.
  if (url.hostname.includes("*") || url.pathname.includes("*") || url.search || url.hash) return [];

  // Same trailing slash handling as publicMediaUrl in rules.ts, so the pattern matches the stored URLs.
  const base = url.pathname.replace(/\/+$/, "");
  return [{ protocol, hostname: url.hostname, ...(url.port ? { port: url.port } : {}), pathname: `${base}/media/**` }];
}
