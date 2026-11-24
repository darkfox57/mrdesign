import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { LandingRoute, landingMetadata } from "@/components/templates/LandingRoute";
import type { Locale } from "@/i18n/routing";
import { getLanding } from "@/lib/landings/landings";

// Landings made with the visual builder and stored in the database: render on request, so a
// publish shows at once (the dashboard actions still revalidate the route).
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

// generateMetadata and the page read the same landing: one query per request.
const loadLanding = cache((locale: Locale, slug: string) => getLanding(locale, slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [locale, { slug }] = await Promise.all([getLocale() as Promise<Locale>, params]);
  return landingMetadata(locale, slug, loadLanding);
}

export default async function LandingPage({ params }: Props) {
  const [locale, { slug }] = await Promise.all([getLocale() as Promise<Locale>, params]);
  return <LandingRoute locale={locale} slug={slug} load={loadLanding} />;
}
