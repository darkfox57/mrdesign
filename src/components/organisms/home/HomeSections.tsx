import { getLocale, getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { Pending } from "@/components/atoms/Pending";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import {
  aboutPoints,
  casePartIds,
  caseStudies,
  criteria,
  faqs,
  phases,
  principles,
  problems,
  serviceLines,
  SHOW_APPLIED_AI,
} from "@/content/home";
import type { Locale } from "@/i18n/routing";
import { CaseBrowser } from "./CaseBrowser";
import { ProblemExplorer } from "./ProblemExplorer";
import { ServiceExplorer } from "./ServiceExplorer";

// Containers of the homepage sections: they read the content and the strings of the current
// locale and hand plain props to the interactive (client) parts.

const two = (value: number) => String(value).padStart(2, "0");
const getContext = async (namespace: string) =>
  Promise.all([getTranslations(`Home.${namespace}`), getLocale() as Promise<Locale>]);

export async function HomeProblems() {
  const [t, locale] = await getContext("problems");
  return (
    <section id="problemas" aria-labelledby="t-prob" className="section-y bg-paper text-text">
      <div className="site-container">
        <SectionHeading id="t-prob" tone="paper" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ProblemExplorer
          labels={{
            list: t("listLabel"),
            problem: t("problem"),
            solution: t("solution"),
            result: t("result"),
            serviceLine: t("serviceLine"),
            seeHow: t("seeHow"),
          }}
          problems={problems.map((problem) => {
            const serviceIndex = serviceLines.findIndex((line) => line.id === problem.serviceLine);
            return {
              title: problem.title[locale],
              problem: problem.problem[locale],
              solutionTitle: problem.solutionTitle[locale],
              solution: problem.solution[locale],
              resultTitle: problem.resultTitle[locale],
              result: problem.result[locale],
              serviceName: serviceLines[serviceIndex].name[locale],
              serviceIndex,
            };
          })}
        />
      </div>
    </section>
  );
}

export async function HomeServices() {
  const [t, locale] = await getContext("services");
  return (
    <section id="servicios" data-surface="ink" aria-labelledby="t-svc" className="section-y bg-ink text-on-ink">
      <div className="site-container">
        <SectionHeading id="t-svc" tone="ink" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ServiceExplorer
          labels={{ tabs: t("tabsLabel"), when: t("when"), deliverables: t("deliverables"), flowTitle: t("flowTitle") }}
          lines={serviceLines.map((line, index) => ({
            name: line.name[locale],
            counter: t("counter", { number: two(index + 1), total: two(serviceLines.length), kind: line.kind[locale] }),
            summary: line.summary[locale],
            when: line.when[locale],
            deliverables: line.deliverables.map((item) => ({ text: item.text[locale], pending: item.pending?.[locale] })),
            flow: line.flow[locale],
            flowLabel: t("flowLabel", { nodes: line.flow[locale].join(", ") }),
            keyNode: line.keyNode,
            caption: line.caption[locale],
          }))}
        />
        {SHOW_APPLIED_AI ? (
          <div
            data-reveal=""
            className="mt-10 grid items-center gap-x-6 gap-y-4 rounded-card border-[1.5px] border-dashed border-pending/55 px-5 py-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-8"
          >
            <span className="mono-label w-fit rounded-md bg-pending px-2.5 py-1.5 whitespace-nowrap text-text">{t("ai.tag")}</span>
            <div>
              <h3 className="text-xl font-semibold">
                {t("ai.title")} <span className="font-normal text-on-ink-muted">{t("ai.optional")}</span>
              </h3>
              <p className="mt-1 text-md text-on-ink-muted">{t("ai.text")}</p>
            </div>
            <span className="mono-label text-on-ink-muted">{t("ai.note")}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export async function HomeCases() {
  const [t, locale] = await getContext("cases");
  return (
    <section id="casos" aria-labelledby="t-cases" className="section-y bg-paper text-text">
      <div className="site-container">
        <SectionHeading id="t-cases" tone="paper" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <CaseBrowser
          labels={{
            picker: t("pickerLabel"),
            next: t("next"),
            nextPending: t("nextPending"),
            quote: t("quote"),
            quotePending: t("quotePending"),
            search: t("search"),
            searchFields: [t("searchWidth"), t("searchProfile"), t("searchRim")],
            illustration: t("illustration"),
            parts: t("partsLabel"),
            metricPending: t("metricPending"),
            projectLink: t("projectLink"),
            linkPending: t("linkPending"),
            sector: t("sector"),
            type: t("type"),
            platform: t("platform"),
            confirm: t("confirm"),
            brandUse: t("brandUse"),
            brandPending: t("brandPending"),
          }}
          cases={caseStudies.map((item, index) => ({
            number: t("caseNumber", { number: two(index + 1) }),
            name: item.name,
            subtitle: item.subtitle[locale],
            url: item.url[locale],
            sector: item.sector[locale],
            type: item.type[locale],
            metrics: [item.metrics[0][locale], item.metrics[1][locale]],
            parts: casePartIds.map((id) => ({
              label: t(`parts.${id}`),
              title: item.parts[id].title[locale],
              text: item.parts[id].text[locale],
              pending: item.parts[id].pending[locale],
            })),
          }))}
        />
      </div>
    </section>
  );
}

export async function HomeProcess() {
  const [t, locale] = await getContext("process");
  return (
    <section id="proceso" data-surface="ink" aria-labelledby="t-proc" className="section-y grid-texture bg-ink text-on-ink">
      <div className="site-container">
        <SectionHeading id="t-proc" tone="ink" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div data-process="" className="relative">
          <div aria-hidden="true" className="absolute inset-x-0 top-6.75 hidden h-0.5 bg-ink-line lg:block">
            <i data-process-track="" className="block h-full origin-left bg-brand-500" />
          </div>
          <ol className="relative grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
            {phases.map((phase, index) => (
              <li key={phase.title.es} data-phase="" className="group flex flex-col gap-3.5">
                <span
                  aria-hidden="true"
                  className="grid size-14 place-items-center rounded-full border-2 border-brand-500 bg-ink font-mono text-sm text-brand-500 transition-colors group-data-on:bg-brand-500 group-data-on:text-ink"
                >
                  {two(index + 1)}
                </span>
                <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.01em]">{phase.title[locale]}</h3>
                <p className="text-md text-on-ink-muted">{phase.text[locale]}</p>
                <p className="mt-1 border-t border-ink-line pt-3 text-sm">
                  <span className="mono-label mb-1 block text-brand-500">{t("receives")}</span>
                  {phase.receives[locale]} {phase.pending ? <Pending>{phase.pending[locale]}</Pending> : null}
                </p>
              </li>
            ))}
          </ol>
        </div>
        <p data-reveal="" className="mt-12 max-w-[70ch] text-md text-on-ink-muted">
          {t("note")} <Pending>{t("notePending")}</Pending>
        </p>
      </div>
    </section>
  );
}

export async function HomeCriteria() {
  const [t, locale] = await getContext("criteria");
  const row = "grid gap-1.5 border-b border-line py-5.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] md:gap-6";
  return (
    <section id="criterio" aria-labelledby="t-crit" className="section-y bg-paper text-text">
      <div className="site-container">
        <SectionHeading id="t-crit" tone="paper" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div data-reveal="" role="table" aria-label={t("tableLabel")} className="border-t-[1.5px] border-text">
          <div role="row" className={`${row} mono-label hidden py-3 text-graphite md:grid`}>
            <span role="columnheader">{t("colNeed")}</span>
            <span role="columnheader">{t("colChoice")}</span>
            <span role="columnheader">{t("colWhy")}</span>
          </div>
          {criteria.map((item) => (
            <div
              key={item.need.es}
              role="row"
              className={`${row} transition-[background-color,padding] md:hover:bg-paper-deep md:hover:px-4`}
            >
              <b role="cell" className="text-lg font-semibold tracking-[-0.01em]">
                {item.need[locale]}
              </b>
              <span role="cell" className="font-display text-xl font-bold tracking-[-0.015em] text-brand-600">
                {item.choice[locale]}
              </span>
              <p role="cell" className="text-md text-graphite">
                {item.why[locale]}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {principles.map((principle, index) => (
            <div key={principle.title.es} data-reveal="" className="flex flex-col gap-2.5 rounded-2xl bg-paper-deep p-6">
              <span className="font-mono text-xs text-brand-600">{t("principle", { number: two(index + 1) })}</span>
              <h3 className="text-xl font-semibold tracking-[-0.01em]">{principle.title[locale]}</h3>
              <p className="text-md text-graphite">{principle.text[locale]}</p>
            </div>
          ))}
        </div>
        <p data-reveal="" className="mt-8 text-md text-graphite">
          {t("stack")} <Pending>{t("stackPending")}</Pending>
        </p>
      </div>
    </section>
  );
}

export async function HomeAbout() {
  const [t, locale] = await getContext("about");
  return (
    <section id="nosotros" data-surface="ink" aria-labelledby="t-about" className="section-y bg-ink text-on-ink">
      <div className="site-container grid grid-cols-1 items-start gap-16 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div
          data-reveal=""
          className="relative flex aspect-4/5 max-w-90 flex-col justify-end gap-1.5 overflow-hidden rounded-card border-[1.5px] border-dashed border-on-ink/30 bg-ink-high p-5 lg:max-w-none"
        >
          <span className="absolute inset-0 grid place-items-center font-mono text-xs text-on-ink-muted">{t("photoPending")}</span>
          <b className="relative text-lg">
            <Pending>{t("namePending")}</Pending>
          </b>
          <span className="relative text-sm text-on-ink-muted">{t("role")}</span>
        </div>
        <div>
          <div data-reveal="">
            <Eyebrow className="text-on-ink-muted">{t("eyebrow")}</Eyebrow>
          </div>
          <h2 id="t-about" data-reveal="" className="font-display-tight mt-4 text-quote leading-[1.12] text-balance">
            {t("title")}
          </h2>
          <p data-reveal="" className="mt-6 max-w-[60ch] text-lg text-on-ink-muted">
            {t("body")} <Pending>{t("bodyPending")}</Pending>
          </p>
          <ul data-reveal="" className="mt-10 grid gap-4 lg:grid-cols-3">
            {aboutPoints.map((point) => (
              <li key={point.title.es} className="flex flex-col gap-1.5 border-t-2 border-brand-500 pt-3.5">
                <b>{point.title[locale]}</b>
                <span className="text-sm text-on-ink-muted">
                  {point.text[locale]} {point.pending ? <Pending>{point.pending[locale]}</Pending> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Answers stay in the DOM for search engines and work without JavaScript: native <details>, and the
// shared name makes it an exclusive accordion where browsers support it.
export async function HomeFaq() {
  const [t, locale] = await getContext("faq");
  return (
    <section id="faq" aria-labelledby="t-faq" className="section-y bg-paper text-text">
      <div className="site-container grid grid-cols-1 items-start gap-16 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div data-reveal="">
          <Eyebrow className="text-graphite">{t("eyebrow")}</Eyebrow>
          <h2 id="t-faq" className="text-section mt-4">
            {t("title")}
          </h2>
          <p className="text-lead mt-5 text-graphite">
            {t("notHere")}{" "}
            <a href="#contacto" className="font-semibold text-brand-600">
              {t("write")}
            </a>
            .
          </p>
        </div>
        <div data-reveal="" className="border-t-[1.5px] border-text">
          {faqs.map((faq, index) => (
            <details key={faq.question.es} name="home-faq" open={index === 0} className="group border-b border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-5.5 [&::-webkit-details-marker]:hidden">
                <h3 className="text-question font-semibold tracking-[-0.01em]">{faq.question[locale]}</h3>
                <span
                  aria-hidden="true"
                  className="grid size-8 flex-none place-items-center rounded-full border-[1.5px] border-text/30 transition group-open:rotate-45 group-open:border-text group-open:bg-text group-open:text-paper"
                >
                  +
                </span>
              </summary>
              <div className="max-w-[68ch] pb-6 text-graphite md:pr-12">
                <p>{faq.answer[locale]}</p>
                {faq.pending ? (
                  <p className="mt-2.5">
                    <Pending>{faq.pending[locale]}</Pending>
                  </p>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
