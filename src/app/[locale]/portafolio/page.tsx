import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CaseList } from "@/components/organisms/CaseList";
import { ClosingCta } from "@/components/organisms/ClosingCta";
import { PortfolioGrid } from "@/components/organisms/PortfolioGrid";
import { projects } from "@/content/portfolio";
import type { Locale } from "@/i18n/routing";
import type { CaseLine } from "@/lib/cases/lines";
import { listPublicCases } from "@/lib/cases/public";
import { casesOrEmpty, portfolioView } from "@/lib/cases/view";
import { sameRouteAlternates } from "@/lib/seo/alternates";

// Published cases live in the database, which the Docker build cannot reach: render on request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("Portfolio"), getLocale()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: sameRouteAlternates(locale as Locale, "/portafolio"),
  };
}

export default async function PortfolioPage() {
  const locale = (await getLocale()) as Locale;
  const [t, home, cases] = await Promise.all([
    getTranslations("Portfolio"),
    getTranslations("Home"),
    casesOrEmpty(() => listPublicCases(locale)),
  ]);
  // While no case is published, the static project grid keeps the page from being empty.
  const view = portfolioView(cases, projects);

  return (
    <>
      <section data-x="PortfolioIndex" className="site-container py-16 lg:py-24">
        <h1 className="text-display max-w-3xl">{t("title")}</h1>
        <p className="text-lead mt-6 max-w-prose text-graphite">{t("lead")}</p>
        <div className="mt-12">
          {view.kind === "cases" ? (
            <CaseList cases={view.cases} lineLabels={t.raw("lines") as Record<CaseLine, string>} />
          ) : (
            <PortfolioGrid locale={locale} projects={view.projects} tagLabels={t.raw("tags")} />
          )}
        </div>
      </section>
      <ClosingCta title={home("ctaTitle")} text={home("ctaText")} button={home("ctaButton")} />
    </>
  );
}
