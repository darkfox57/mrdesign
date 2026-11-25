import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/atoms/JsonLd";
import { ScrollReveals } from "@/components/motion/ScrollReveals";
import { ClosingCta } from "@/components/organisms/ClosingCta";
import { LineBuild, LineHero } from "@/components/organisms/service-line/LineHero";
import { LineCases, LineComparison, LineDeliverables, LineFaq, RelatedLines } from "@/components/organisms/service-line/LineSections";
import { getService, services } from "@/content/services";
import { getPathname, permanentRedirect } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import type { CaseLine } from "@/lib/cases/lines";
import { listPublicCases } from "@/lib/cases/public";
import { casesOrEmpty } from "@/lib/cases/view";
import { localizedAlternates, mapValues } from "@/lib/seo/alternates";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/open-graph";
import { casesForLine } from "@/lib/service-lines/cases";

type Props = PageProps<"/[locale]/servicios/[service]">;

// A line's published cases live in the database, which the Docker build cannot reach: render on
// request, like the portfolio.
export const dynamic = "force-dynamic";

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
  return pageMetadata(locale, {
    title: service.content.metaTitle[locale],
    description: service.content.metaDescription[locale],
    alternates: localizedAlternates(
      locale,
      mapValues(service.slug, (slug) => ({ pathname: "/servicios/[service]" as const, params: { service: slug } })),
    ),
  });
}

// One page per line of work (odd/tasks/site-build-experience.md, T5): the answer-first hero, the
// line's own build stage, deliverables, a comparison, the FAQ, its published cases and related lines.
export default async function ServiceLinePage(props: Props) {
  const { locale, service } = await resolve(props);
  const [t, portfolio, allCases] = await Promise.all([
    getTranslations("Services"),
    getTranslations("Portfolio"),
    // A database outage hides the cases instead of failing the page.
    casesOrEmpty(() => listPublicCases(locale)),
  ]);
  const cases = casesForLine(allCases, service.id);
  const path = getPathname({ locale, href: { pathname: "/servicios/[service]", params: { service: service.slug[locale] } } });
  const { content } = service;

  return (
    <ScrollReveals>
      <JsonLd data={serviceJsonLd({ name: service.name[locale], description: content.summary[locale], url: path })} />
      <JsonLd data={faqPageJsonLd(content.faqs.map((faq) => ({ question: faq.q[locale], answer: faq.a[locale] })), path)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t("breadcrumb"), path: getPathname({ locale, href: "/servicios" }) },
          { name: service.name[locale], path },
        ])}
      />

      <LineHero service={service} locale={locale} number={services.indexOf(service) + 1} />
      <LineBuild service={service} locale={locale} />
      <LineDeliverables service={service} locale={locale} />
      <LineComparison service={service} locale={locale} />
      <LineFaq service={service} locale={locale} />
      {cases.length > 0 ? <LineCases cases={cases} lineLabels={portfolio.raw("lines") as Record<CaseLine, string>} /> : null}
      <RelatedLines service={service} locale={locale} />
      <ClosingCta title={t("ctaTitle")} text={t("ctaText")} button={t("ctaButton")} />
    </ScrollReveals>
  );
}
