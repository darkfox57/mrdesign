import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BuilderLandingPage } from "@/components/templates/BuilderLandingPage";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { findLandingTranslation, getLanding, landingTranslations } from "@/lib/landings/landings";
import { landingHref } from "@/lib/landings/routes";
import { localizedAlternates, mapValues } from "@/lib/seo/alternates";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { firstHeroLead } from "@/lib/visual-builder/page-data";

// The public landing route (/soluciones/[slug], /en/solutions/[slug]): the landing of that slug,
// its metadata with one hreflang link per published translation, and the redirect from the other
// language's slug (the language switcher keeps the slug). getLanding is wrapped in React cache by
// the page, so metadata and page share one query.

type Loader = (locale: Locale, slug: string) => ReturnType<typeof getLanding>;

export async function landingMetadata(locale: Locale, slug: string, load: Loader = getLanding): Promise<Metadata> {
  const landing = await load(locale, slug);
  if (!landing) return {};
  const translations = await landingTranslations(landing.translationKey);
  return {
    title: landing.seoTitle ?? landing.title,
    description: landing.seoDescription ?? firstHeroLead(landing.blocks),
    // hreflang only for the language versions that are published.
    alternates: localizedAlternates(locale, mapValues(translations, landingHref)),
  };
}

export async function LandingRoute({ locale, slug, load = getLanding }: { locale: Locale; slug: string; load?: Loader }) {
  const landing = await load(locale, slug);
  if (!landing) {
    // A slug from the other locale leads to its translation, or to the home page when there is
    // none. Unknown slugs and drafts are a 404. Slugs can change in the dashboard, so the redirect
    // is temporary.
    const translation = await findLandingTranslation(slug, locale);
    // The same slug in this locale means the landing exists but cannot be shown (see getLanding).
    if (!translation || translation.slug === slug) notFound();
    // next-intl's redirect throws, but its type does not say so.
    return redirect({ href: translation.slug ? landingHref(translation.slug) : "/", locale });
  }

  const t = await getTranslations({ locale, namespace: "Landing" });
  const breadcrumb = breadcrumbJsonLd([
    { name: t("breadcrumbHome"), path: getPathname({ locale, href: "/" }) },
    { name: landing.title, path: getPathname({ locale, href: landingHref(landing.slug) }) },
  ]);
  return <BuilderLandingPage blocks={landing.blocks} locale={locale} breadcrumb={breadcrumb} />;
}
