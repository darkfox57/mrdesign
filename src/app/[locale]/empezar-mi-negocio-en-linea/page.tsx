import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/atoms/JsonLd";
import { ScrollReveals } from "@/components/motion/ScrollReveals";
import { ClosingCta } from "@/components/organisms/ClosingCta";
import { GuideBuild, GuideFaq, GuideHero, GuideIndex, GuideParts } from "@/components/organisms/founder-guide/GuideSections";
import { founderGuide } from "@/content/founder-guide";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { sameRouteAlternates } from "@/lib/seo/alternates";
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/open-graph";

// The founder guide (odd/tasks/site-build-experience.md, T6, S6, S8): code-owned copy, no database,
// so the page is static.

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  return pageMetadata(locale, {
    title: founderGuide.metaTitle[locale],
    description: founderGuide.metaDescription[locale],
    alternates: sameRouteAlternates(locale, "/empezar-mi-negocio-en-linea"),
  });
}

export default async function FounderGuidePage() {
  const [locale, t, line] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("FounderGuide"),
    getTranslations("ServiceLine"),
  ]);
  const guide = founderGuide;
  const path = getPathname({ locale, href: "/empezar-mi-negocio-en-linea" });

  return (
    <ScrollReveals>
      <JsonLd data={articleJsonLd({ headline: guide.h1[locale], description: guide.metaDescription[locale], url: path, locale })} />
      <JsonLd data={faqPageJsonLd(guide.faqs.map((faq) => ({ question: faq.q[locale], answer: faq.a[locale] })), path)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: line("home"), path: getPathname({ locale, href: "/" }) },
          { name: t("breadcrumb"), path },
        ])}
      />

      <GuideHero guide={guide} locale={locale} />
      <GuideBuild guide={guide} locale={locale} />
      <GuideIndex guide={guide} locale={locale} />
      <GuideParts guide={guide} locale={locale} />
      <GuideFaq guide={guide} locale={locale} />
      <ClosingCta title={guide.cta.title[locale]} text={guide.cta.text[locale]} button={guide.cta.button[locale]} />
    </ScrollReveals>
  );
}
