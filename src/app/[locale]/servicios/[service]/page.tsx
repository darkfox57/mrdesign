import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/atoms/JsonLd";
import { ClosingCta } from "@/components/organisms/ClosingCta";
import { ServicesList } from "@/components/organisms/ServicesList";
import { getService, services } from "@/content/services";
import { getPathname, permanentRedirect } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { localizedAlternates, mapValues } from "@/lib/seo/alternates";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo/json-ld";

type Props = PageProps<"/[locale]/servicios/[service]">;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => services.map((service) => ({ locale, service: service.slug[locale] })));
}

async function resolve(props: Props) {
  const params = await props.params;
  const locale = params.locale as Locale;
  const service = getService(locale, params.service);
  if (service) return { locale, service };

  // A slug from another language (language switcher, shared links): send it to this language's slug.
  const translated = routing.locales.map((other) => getService(other, params.service)).find(Boolean);
  if (translated) {
    permanentRedirect({
      href: { pathname: "/servicios/[service]", params: { service: translated.slug[locale] } },
      locale,
    });
  }
  notFound();
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, service } = await resolve(props);
  return {
    title: service.name[locale],
    description: service.summary[locale],
    alternates: localizedAlternates(
      locale,
      mapValues(service.slug, (slug) => ({ pathname: "/servicios/[service]" as const, params: { service: slug } })),
    ),
  };
}

export default async function ServicePage(props: Props) {
  const { locale, service } = await resolve(props);
  const t = await getTranslations("Services");
  const path = getPathname({
    locale,
    href: { pathname: "/servicios/[service]", params: { service: service.slug[locale] } },
  });
  const others = services.filter((item) => item.id !== service.id);

  return (
    <>
      <JsonLd data={serviceJsonLd({ name: service.name[locale], description: service.summary[locale], url: path })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t("breadcrumb"), path: getPathname({ locale, href: "/servicios" }) },
          { name: service.name[locale], path },
        ])}
      />

      <section className="site-container grid gap-12 py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:py-24">
        <div>
          <h1 className="text-display">{service.name[locale]}</h1>
          <p className="text-lead mt-6 max-w-prose text-graphite">{service.summary[locale]}</p>
        </div>
        <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-title">{t("deliverablesTitle")}</h2>
          <ul className="mt-5 grid gap-4">
            {service.deliverables[locale].map((item) => (
              <li key={item} className="flex gap-3">
                <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ClosingCta title={t("ctaTitle")} text={t("ctaText")} button={t("ctaButton")} />

      <section aria-labelledby="other-services" className="site-container pb-20 lg:pb-28">
        <h2 id="other-services" className="text-headline">
          {t("otherTitle")}
        </h2>
        <div className="mt-8">
          <ServicesList locale={locale} services={others} linkLabel={(name) => t("more", { name })} />
        </div>
      </section>
    </>
  );
}
