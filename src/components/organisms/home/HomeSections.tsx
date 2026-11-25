import { getLocale, getTranslations } from "next-intl/server";
import { Pending } from "@/components/atoms/Pending";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { CaseCard } from "@/components/organisms/CaseCard";
import { demoBlocks, demoFormKinds, demoProduct } from "@/content/home-pieces";
import { lineTags, phases, problems, SHOW_PENDING_CONTENT, startingProblems, type Problem } from "@/content/home";
import { services } from "@/content/services";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CaseLine } from "@/lib/cases/lines";
import type { PublicCaseCard } from "@/lib/cases/public";
import { CommercePieces } from "./CommercePieces";
import { ContentBlocksPiece } from "./ContentBlocksPiece";
import { DemoFormPiece } from "./DemoFormPiece";
import { ProblemExplorer, type ExplorerProblem } from "./ProblemExplorer";

// Containers of the homepage sections (odd/tasks/site-build-experience.md, T4): they read the
// content and the strings of the current locale and hand plain props to the presentational and
// interactive parts. `number` is the section's place among the sections shown
// (src/lib/home/pending.ts), so hiding one never leaves a gap.

type SectionProps = { number: string };

const two = (value: number) => String(value).padStart(2, "0");
const getContext = async (namespace: string) =>
  Promise.all([getTranslations(`Home.${namespace}`), getLocale() as Promise<Locale>]);

const serviceById = new Map(services.map((service) => [service.id, service]));

function toExplorer(problem: Problem, locale: Locale): ExplorerProblem {
  const service = serviceById.get(problem.line);
  return {
    title: problem.title[locale],
    problem: problem.problem[locale],
    solution: problem.solution[locale],
    result: problem.result[locale],
    line: { name: service?.name[locale] ?? problem.line, slug: service?.slug[locale] ?? problem.line },
    nodes: problem.nodes.map((node) => ({ before: node.before[locale], after: node.after[locale] })),
  };
}

export async function HomeProblems({ number }: SectionProps) {
  const [t, locale] = await getContext("problems");
  return (
    <section id="problemas" data-x="ProblemExplorer" data-surface="ink" aria-labelledby="t-prob" className="section-y relative border-t border-on-ink/10 bg-ink-raised text-on-ink">
      <div className="site-container">
        <SectionHeading id="t-prob" tone="ink" eyebrow={t("eyebrow", { number })} title={t("title")} lead={t("lead")} />
        <ProblemExplorer
          paths={{
            starting: startingProblems.map((problem) => toExplorer(problem, locale)),
            existing: problems.map((problem) => toExplorer(problem, locale)),
          }}
        />
      </div>
    </section>
  );
}

export async function HomePieces({ number }: SectionProps) {
  const [t, locale] = await getContext("pieces");
  return (
    <section id="piezas" data-x="Pieces" aria-labelledby="t-pieces" className="section-y relative bg-paper text-text">
      <div className="site-container">
        <SectionHeading id="t-pieces" tone="paper" eyebrow={t("eyebrow", { number })} title={t("title")} lead={t("lead")} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,32.5rem),1fr))] gap-6">
          <CommercePieces
            product={{
              name: demoProduct.name[locale],
              price: demoProduct.price,
              stock: demoProduct.stock[locale],
              variants: demoProduct.variants.map((variant) => ({ id: variant.id, name: variant.name[locale], tone: variant.tone })),
            }}
          />
          <DemoFormPiece kinds={demoFormKinds.map((kind) => kind[locale])} />
          <ContentBlocksPiece
            texts={{
              title: demoBlocks.title?.[locale] ?? null,
              text: demoBlocks.text?.[locale] ?? null,
              image: null,
              quote: demoBlocks.quote?.[locale] ?? null,
            }}
          />
        </div>
      </div>
    </section>
  );
}

// One row per line of work in services.ts, whatever it holds, each leading to its own page.
export async function HomeServiceLines({ number }: SectionProps) {
  const [t, locale] = await getContext("lines");
  return (
    <section id="lineas" data-x="ServiceLines" data-surface="ink" aria-labelledby="t-lines" className="section-y relative bg-ink text-on-ink">
      <div className="site-container">
        <SectionHeading
          id="t-lines"
          tone="ink"
          eyebrow={t("eyebrow", { number })}
          title={t("title", { count: services.length })}
          className="max-w-4xl lg:grid-cols-1"
        />
        <ul className="border-b border-ink-line">
          {services.map((service, index) => {
            const tags = lineTags[service.id]?.[locale];
            return (
              <li key={service.id} data-x="ServiceRow" data-reveal="" className="relative">
                <Link
                  href={{ pathname: "/servicios/[service]", params: { service: service.slug[locale] } }}
                  className="group grid grid-cols-[3rem_minmax(0,1fr)] gap-x-6 gap-y-2 border-t border-ink-line py-7 text-on-ink no-underline transition-[padding,background-color] duration-300 hover:bg-ink-raised md:grid-cols-[4.5rem_minmax(0,1.3fr)_minmax(0,1.6fr)_auto] md:items-center md:hover:pl-4"
                >
                  <span className="font-mono text-sm text-brand-400">{two(index + 1)}</span>
                  <span className="font-display-tight text-tab">{service.name[locale]}</span>
                  <span className="col-start-2 flex flex-col gap-2 md:col-start-auto">
                    <span className="text-on-ink-muted">{service.summary[locale]}</span>
                    {tags ? <span className="font-mono text-xs text-on-ink">{tags}</span> : null}
                  </span>
                  <span className="col-start-2 font-mono text-sm whitespace-nowrap text-brand-400 transition-transform duration-300 group-hover:translate-x-2 md:col-start-auto">
                    {t("cta")} <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// Published cases only (S2, S5): the page hides this section when there is none.
export async function HomeCases({ number, cases }: SectionProps & { cases: PublicCaseCard[] }) {
  const [t, portfolio] = await Promise.all([getTranslations("Home.cases"), getTranslations("Portfolio")]);
  return (
    <section id="casos" data-x="CaseList" aria-labelledby="t-cases" className="section-y relative bg-paper text-text">
      <div className="site-container">
        <SectionHeading id="t-cases" tone="paper" eyebrow={t("eyebrow", { number })} title={t("title")} lead={t("lead")} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((item) => (
            <li key={item.id} data-reveal="">
              <CaseCard item={item} lineLabels={portfolio.raw("lines") as Record<CaseLine, string>} titleAs="h3" />
            </li>
          ))}
        </ul>
        <Link href="/portafolio" className="mt-10 inline-flex min-h-11 items-center font-semibold text-brand-600 underline-offset-4 hover:underline">
          {t("all")} <span aria-hidden="true">&nbsp;→</span>
        </Link>
      </div>
    </section>
  );
}

// The process as a terminal: each phase is a line of the build.
export async function HomeProcess({ number }: SectionProps) {
  const [t, locale] = await getContext("process");
  return (
    <section id="proceso" data-x="BuildLog" data-surface="ink" aria-labelledby="t-process" className="section-y relative bg-ink text-on-ink">
      <div className="site-container flex flex-wrap items-start gap-14">
        <SectionHeading
          id="t-process"
          tone="ink"
          eyebrow={t("eyebrow", { number })}
          title={t("title")}
          lead={t("lead")}
          className="mb-0 flex-[1_1_26rem] lg:mb-0 lg:grid-cols-1"
        />
        <div className="min-w-0 flex-[1.4_1_35rem] overflow-hidden rounded-card border border-ink-line bg-ink-raised font-mono">
          <div className="flex items-center gap-2 bg-ink-high px-4 py-3 text-xs text-on-ink-muted">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-ink-dim" />
            {t("terminal")}
          </div>
          <div className="flex flex-col gap-4.5 p-5 text-sm md:p-6">
            <p aria-hidden="true" className="text-on-ink">
              <span className="text-brand-400">$</span> {t("command")}
            </p>
            <ol className="flex flex-col gap-4.5">
              {phases.map((phase, index) => (
                <li key={phase.title.es} data-reveal="" className="grid grid-cols-[2.125rem_minmax(0,1fr)] gap-x-3 gap-y-1 md:grid-cols-[2.125rem_10rem_minmax(0,1fr)]">
                  <span className="text-brand-400">{two(index + 1)}</span>
                  <span className="font-bold text-on-ink lowercase">{phase.title[locale]}</span>
                  <span className="col-start-2 text-on-ink-muted md:col-start-auto">
                    {phase.text[locale]}
                    {SHOW_PENDING_CONTENT && phase.pending ? <Pending className="ml-1.5">{phase.pending[locale]}</Pending> : null}
                  </span>
                </li>
              ))}
            </ol>
            <p data-reveal="" className="text-live">
              {t("done")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
