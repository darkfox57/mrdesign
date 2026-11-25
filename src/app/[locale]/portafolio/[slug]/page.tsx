import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { JsonLd } from "@/components/atoms/JsonLd";
import { CaseStudy } from "@/components/organisms/CaseStudy";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CaseLine } from "@/lib/cases/lines";
import { findPublicCaseTranslation, getPublicCase, publicCaseTranslations, relatedPublicCases } from "@/lib/cases/public";
import { localizedAlternates, mapValues } from "@/lib/seo/alternates";
import { breadcrumbJsonLd, caseStudyJsonLd } from "@/lib/seo/json-ld";

// Cases live in the database, which the Docker build cannot reach: render on request.
export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/portafolio/[slug]">;

const caseHref = (slug: string) => ({ pathname: "/portafolio/[slug]" as const, params: { slug } });

// generateMetadata and the page read the same case: one query per request.
const loadCase = cache((locale: Locale, slug: string) => getPublicCase(locale, slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const item = await loadCase(locale, slug);
  if (!item) return {};
  const translations = await publicCaseTranslations(item.translationKey);
  return {
    title: item.seoTitle ?? item.title,
    description: item.seoDescription ?? item.summary,
    // hreflang only for the language versions that are public.
    alternates: localizedAlternates(locale, mapValues(translations, caseHref)),
    openGraph: {
      type: "article",
      publishedTime: item.publishedAt?.toISOString(),
      modifiedTime: item.updatedAt.toISOString(),
      images: item.coverImageUrl ? [{ url: item.coverImageUrl, alt: item.coverImageAlt || item.title }] : undefined,
    },
  };
}

export default async function CasePage({ params }: Props) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const item = await loadCase(locale, slug);
  if (!item) {
    // A slug from the other locale (the language switcher keeps it) leads to its translation, or to
    // this locale's portfolio when there is none. Unknown slugs, drafts, unauthorized and archived
    // cases are a 404. Slugs can change in the dashboard, so the redirect is temporary.
    const translation = await findPublicCaseTranslation(slug, locale);
    if (!translation) notFound();
    // next-intl's redirect throws, but its type does not say so.
    return redirect({ href: translation.slug ? caseHref(translation.slug) : "/portafolio", locale });
  }

  const [t, related] = await Promise.all([getTranslations("Portfolio"), relatedPublicCases(item, 3)]);
  const lineLabels = t.raw("lines") as Record<CaseLine, string>;
  const path = getPathname({ locale, href: caseHref(item.slug) });

  return (
    <>
      <JsonLd
        data={caseStudyJsonLd({
          title: item.title,
          summary: item.summary,
          url: path,
          locale: item.locale,
          image: item.coverImageUrl,
          lines: item.lines.map((line) => lineLabels[line]),
          stack: item.stack,
          year: item.year,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t("case.breadcrumbHome"), path: getPathname({ locale, href: "/" }) },
          { name: t("title"), path: getPathname({ locale, href: "/portafolio" }) },
          { name: item.title, path },
        ])}
      />
      <CaseStudy item={item} related={related} lineLabels={lineLabels} />
    </>
  );
}
