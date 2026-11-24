// The client can send any X-Forwarded-For; the proxy in front of the app (Dokploy's Traefik) appends the
// real address as the LAST entry, so that is the only one to trust. Without a proxy this value is
// client-controlled, which only weakens the per-IP layer: the per-account lock does not use it.
// Deploy assumption (docs/deploy-dokploy.md): the app is reached only through that proxy.
export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  return forwarded?.at(-1) || headers.get("x-real-ip") || "unknown";
}
