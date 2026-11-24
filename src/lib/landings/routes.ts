// The public address of a landing (localized by src/i18n/routing.ts: /soluciones/<slug> in
// Spanish, /en/solutions/<slug> in English).
export function landingHref(slug: string) {
  return { pathname: "/soluciones/[slug]", params: { slug } } as const;
}

// The route to refresh after a landing changes, for revalidatePath(path, "page"). With the
// next-intl proxy, revalidatePath needs the route the proxy rewrites to (the destination, see
// "Using revalidatePath with rewrites" in the Next docs), not the public URL: /en/solutions/x is
// served by src/app/[locale]/soluciones/[slug]. The dynamic route pattern covers every slug in every
// locale, so a changed slug, the old one and the translations (their hreflang links) all refresh.
export const PUBLIC_LANDING_ROUTE = "/[locale]/soluciones/[slug]";
