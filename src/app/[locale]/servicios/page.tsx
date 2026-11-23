import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ClosingCta } from "@/components/organisms/ClosingCta";
import { ServicesList } from "@/components/organisms/ServicesList";
import { services } from "@/content/services";
import type { Locale } from "@/i18n/routing";
import { sameRouteAlternates } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("Services"), getLocale()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: sameRouteAlternates(locale as Locale, "/servicios"),
  };
}

export default async function ServicesPage() {
  const [t, locale] = await Promise.all([getTranslations("Services"), getLocale() as Promise<Locale>]);

  return (
    <>
      <section className="site-container py-16 lg:py-24">
        <h1 className="text-display max-w-3xl">{t("title")}</h1>
        <p className="text-lead mt-6 max-w-prose text-graphite">{t("lead")}</p>
        <div className="mt-12">
          <ServicesList
            locale={locale}
            services={services}
            headingLevel="h2"
            linkLabel={(name) => t("more", { name })}
          />
        </div>
      </section>
      <ClosingCta title={t("ctaTitle")} text={t("ctaText")} button={t("ctaButton")} />
    </>
  );
}
