import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { CaseList } from "@/components/organisms/CaseList";
import { services, type Service } from "@/content/services";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CaseLine } from "@/lib/cases/lines";
import type { PublicCaseCard } from "@/lib/cases/public";
import { cn } from "@/lib/cn";

// The sections of a line page below its build stage (odd/tasks/site-build-experience.md, T5).
// Presentational: the page hands them the line and, for the cases, the published cases of the line.
// Everything is server-rendered text, readable without JavaScript.

type LineProps = { service: Service; locale: Locale };

const two = (value: number) => String(value).padStart(2, "0");

export function LineDeliverables({ service, locale }: LineProps) {
  const t = useTranslations("ServiceLine.deliverables");
  return (
    <section id="deliverables" data-x="Deliverables" aria-labelledby="line-deliverables" className="section-y relative bg-paper text-text">
      <div className="site-container">
        <SectionHeading id="line-deliverables" tone="paper" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {service.content.deliverables.map((deliverable) => (
            <li key={deliverable.code} data-reveal="">
              <article data-x="DeliverableCard" className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-6 transition-colors hover:border-ink">
                <span className="font-mono text-sm text-brand-600">{deliverable.code}</span>
                <h3 className="text-title">{deliverable.title[locale]}</h3>
                <p className="text-pretty text-graphite">{deliverable.description[locale]}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LineComparison({ service, locale }: LineProps) {
  const t = useTranslations("ServiceLine.comparison");
  const { columns, rows, highlight } = service.content.comparison;
  const mark = (index: number) => index === highlight;

  return (
    <section id="comparison" data-x="PlatformComparison" aria-labelledby="line-comparison" className="section-y relative border-t border-line bg-paper-deep text-text">
      <div className="site-container">
        <SectionHeading id="line-comparison" tone="paper" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        {/* A wide table scrolls inside its own region on small screens; the region is focusable so
            the keyboard can scroll it too. */}
        <div
          data-reveal=""
          role="region"
          aria-labelledby="line-comparison-caption"
          tabIndex={0}
          className="overflow-x-auto rounded-card border border-line bg-surface"
        >
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <caption id="line-comparison-caption" className="sr-only">
              {t("caption", { name: service.name[locale] })}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="mono-label w-[22%] p-5 align-bottom font-normal text-graphite">
                  {t("criterion")}
                </th>
                {columns[locale].map((column, index) => (
                  <th key={column} scope="col" className={cn("p-5 align-bottom text-title", mark(index) && "bg-ink text-on-ink")}>
                    {mark(index) ? <span className="mono-label mb-2 block text-brand-400">{t("highlight")}</span> : null}
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label.es} className="border-t border-line">
                  <th scope="row" className="p-5 align-top font-semibold">
                    {row.label[locale]}
                  </th>
                  {row.cells[locale].map((cell, index) => (
                    <td key={index} className={cn("p-5 align-top text-pretty", mark(index) ? "bg-brand-50 text-text" : "text-graphite")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// The answers are in the HTML even while closed (<details>): search engines and assistants read them.
export function LineFaq({ service, locale }: LineProps) {
  const t = useTranslations("ServiceLine.faq");
  return (
    <section id="faq" data-x="FaqList" aria-labelledby="line-faq" className="section-y relative bg-paper text-text">
      <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
        <div data-reveal="">
          <Eyebrow className="text-graphite">{t("eyebrow")}</Eyebrow>
          <h2 id="line-faq" className="text-section mt-4">
            {t("title")}
          </h2>
          <p className="text-lead mt-6 max-w-[40ch] text-pretty text-graphite">{t("lead")}</p>
        </div>
        <div className="border-t border-line">
          {service.content.faqs.map((faq, index) => (
            <details key={faq.q.es} data-x="FaqItem" open={index === 0} className="group border-b border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="text-question font-semibold">{faq.q[locale]}</h3>
                <span aria-hidden="true" className="mt-0.5 font-mono text-xl leading-none text-brand-600 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-[65ch] pb-6 text-pretty text-graphite">{faq.a[locale]}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// Published cases of this line only; the page leaves this section out when there is none.
export function LineCases({ cases, lineLabels }: { cases: PublicCaseCard[]; lineLabels: Record<CaseLine, string> }) {
  const t = useTranslations("ServiceLine.cases");
  return (
    <section id="cases" data-x="LineCases" aria-labelledby="line-cases" className="section-y relative border-t border-line bg-paper text-text">
      <div className="site-container">
        <SectionHeading id="line-cases" tone="paper" eyebrow={t("eyebrow")} title={t("title")} />
        <CaseList cases={cases} lineLabels={lineLabels} titleAs="h3" />
      </div>
    </section>
  );
}

export function RelatedLines({ service, locale }: LineProps) {
  const t = useTranslations("ServiceLine.related");
  const related = service.content.related.flatMap((item) => {
    const index = services.findIndex((other) => other.id === item.id);
    return index < 0 ? [] : [{ line: services[index], number: index + 1, reason: item.reason[locale] }];
  });

  return (
    <section id="related" data-x="RelatedLines" data-surface="ink" aria-labelledby="line-related" className="section-y relative bg-ink text-on-ink">
      <div className="site-container">
        <SectionHeading id="line-related" tone="ink" eyebrow={t("eyebrow")} title={t("title")} className="lg:grid-cols-1" />
        <ul className="grid gap-5 md:grid-cols-3">
          {related.map(({ line, number, reason }) => (
            <li key={line.id} data-reveal="">
              <Link
                href={{ pathname: "/servicios/[service]", params: { service: line.slug[locale] } }}
                className="group flex h-full flex-col gap-3 rounded-card border border-ink-line p-6 text-on-ink no-underline transition-colors hover:border-brand-500 hover:bg-ink-raised"
              >
                <span className="font-mono text-sm text-brand-400">{two(number)}</span>
                <span className="font-display-tight text-tab">{line.name[locale]}</span>
                <span className="text-pretty text-on-ink-muted">{reason}</span>
                <span aria-hidden="true" className="mt-auto font-mono text-brand-400 transition-transform group-hover:translate-x-2">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
