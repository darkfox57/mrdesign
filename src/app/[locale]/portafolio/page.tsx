import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ClosingCta } from "@/components/organisms/ClosingCta";
import { PortfolioGrid } from "@/components/organisms/PortfolioGrid";
import { projects } from "@/content/portfolio";
import type { Locale } from "@/i18n/routing";
import { sameRouteAlternates } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("Portfolio"), getLocale()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: sameRouteAlternates(locale as Locale, "/portafolio"),
  };
}

export default async function PortfolioPage() {
  const [t, home, locale] = await Promise.all([
    getTranslations("Portfolio"),
    getTranslations("Home"),
    getLocale() as Promise<Locale>,
  ]);

  return (
    <>
      <section className="site-container py-16 lg:py-24">
        <h1 className="text-display max-w-3xl">{t("title")}</h1>
        <p className="text-lead mt-6 max-w-prose text-graphite">{t("lead")}</p>
        <div className="mt-12">
          <PortfolioGrid locale={locale} projects={projects} tagLabels={t.raw("tags")} />
        </div>
      </section>
      <ClosingCta title={home("ctaTitle")} text={home("ctaText")} button={home("ctaButton")} />
    </>
  );
}
