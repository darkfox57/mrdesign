import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { PlatformPicker } from "@/components/molecules/PlatformPicker";
import { ClosingCta } from "@/components/organisms/ClosingCta";
import { PortfolioGrid } from "@/components/organisms/PortfolioGrid";
import { ProcessSteps } from "@/components/organisms/ProcessSteps";
import { ServicesList } from "@/components/organisms/ServicesList";
import { projects } from "@/content/portfolio";
import { services } from "@/content/services";
import type { Locale } from "@/i18n/routing";
import { sameRouteAlternates } from "@/lib/seo/alternates";

type Item = { title: string; text: string };

export async function generateMetadata(): Promise<Metadata> {
  const [t, meta, locale] = await Promise.all([getTranslations("Home"), getTranslations("Metadata"), getLocale()]);
  return {
    title: { absolute: `Mr. Design: ${t("metaTitle")}` },
    description: meta("description"),
    alternates: sameRouteAlternates(locale as Locale, "/"),
  };
}

export default async function HomePage() {
  const [t, services_t, portfolio_t, locale] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Services"),
    getTranslations("Portfolio"),
    getLocale() as Promise<Locale>,
  ]);

  return (
    <>
      <section className="site-container grid gap-12 py-16 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-16 lg:py-24">
        <div>
          <h1 className="text-display">{t("title")}</h1>
          <p className="text-lead mt-6 max-w-prose text-graphite">{t("lead")}</p>
          <ButtonLink href="/contacto" className="mt-8">
            {t("ctaButton")}
          </ButtonLink>
        </div>
        <PlatformPicker
          locale={locale}
          title={t("pickerTitle")}
          lead={t("pickerLead")}
          customLabel={t("pickerCustom")}
        />
      </section>

      <section aria-labelledby="services-title" className="site-container py-16 lg:py-24">
        <div className="max-w-2xl">
          <h2 id="services-title" className="text-headline">
            {t("servicesTitle")}
          </h2>
          <p className="text-lead mt-4 text-graphite">{t("servicesLead")}</p>
        </div>
        <div className="mt-10">
          <ServicesList
            locale={locale}
            services={services}
            linkLabel={(name) => services_t("more", { name })}
          />
        </div>
      </section>

      <section aria-labelledby="why-title" className="border-y border-line bg-surface">
        <div className="site-container grid gap-10 py-16 lg:grid-cols-[1fr_2fr] lg:py-24">
          <h2 id="why-title" className="text-headline">
            {t("whyTitle")}
          </h2>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {(t.raw("why") as Item[]).map((item) => (
              <li key={item.title}>
                <h3 className="text-title">{item.title}</h3>
                <p className="mt-2 text-graphite">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="portfolio-title" className="site-container py-16 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="portfolio-title" className="text-headline">
              {t("portfolioTitle")}
            </h2>
            <p className="text-lead mt-4 text-graphite">{t("portfolioLead")}</p>
          </div>
          <ButtonLink href="/portafolio" variant="secondary">
            {t("portfolioAll")}
          </ButtonLink>
        </div>
        <div className="mt-10">
          <PortfolioGrid locale={locale} projects={projects.slice(0, 3)} tagLabels={portfolio_t.raw("tags")} />
        </div>
      </section>

      <ProcessSteps title={t("processTitle")} steps={t.raw("process") as Item[]} />

      <ClosingCta title={t("ctaTitle")} text={t("ctaText")} button={t("ctaButton")} />
    </>
  );
}
