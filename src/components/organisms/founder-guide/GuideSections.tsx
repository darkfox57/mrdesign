import { useTranslations } from "next-intl";
import { ButtonLink, buttonBase, buttonSizes, buttonVariants } from "@/components/atoms/ButtonLink";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { BuildStage } from "@/components/motion/BuildStage";
import type { FounderGuide, FounderGuideItem } from "@/content/founder-guide";
import { serviceEntries } from "@/content/service-catalog";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { FounderScreen } from "./FounderScreen";

// The founder guide (odd/tasks/site-build-experience.md, T6, S6, S8). Presentational: the page hands
// them the approved copy. Everything is server-rendered text, readable without JavaScript; only the
// build stage is interactive, and it shows the finished build without JavaScript.

type GuideProps = { guide: FounderGuide; locale: Locale };

const two = (value: number) => String(value).padStart(2, "0");

// The top of the guide: where it sits, the h1 and the answer-first lead (the first thing search
// engines and assistants read).
export function GuideHero({ guide, locale }: GuideProps) {
  const t = useTranslations("FounderGuide");
  const line = useTranslations("ServiceLine");

  return (
    <section data-x="GuideHero" data-surface="ink" aria-labelledby="guide-title" className="relative bg-ink text-on-ink">
      <div className="site-container pt-8 pb-16 lg:pt-12 lg:pb-22">
        <nav aria-label={line("breadcrumbLabel")} data-x="Breadcrumbs" className="font-mono text-xs text-on-ink-muted">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center hover:text-on-ink">
                {line("home")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-on-ink">
              {t("breadcrumb")}
            </li>
          </ol>
        </nav>

        <div className="mt-8 max-w-5xl lg:mt-12">
          <p className="font-mono text-caption text-on-ink-muted">{t("eyebrow")}</p>
          <h1 id="guide-title" className="text-display mt-5 wrap-break-word">
            {guide.h1[locale]}
          </h1>
          <p data-x="AnswerSummary" className="text-lead mt-7 max-w-[68ch] text-pretty text-on-ink-muted">
            {guide.lead[locale]}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/contacto">{guide.cta.button[locale]}</ButtonLink>
            <a href="#indice" className={cn(buttonBase, buttonSizes.lg, buttonVariants.secondary)}>
              {t("ctaSections")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// The guide's own build stage: the steps as readable text next to a screen that assembles them.
export function GuideBuild({ guide, locale }: GuideProps) {
  const t = useTranslations("FounderGuide");
  const stage = useTranslations("ServiceLine.stage");
  const steps = guide.buildSteps;

  return (
    <section id="camino" data-x="GuideBuild" data-surface="ink" aria-labelledby="guide-build" className="section-y relative border-t border-on-ink/10 bg-ink text-on-ink">
      <div className="site-container">
        <div data-reveal="" className="mb-10 max-w-3xl lg:mb-16">
          <p className="mono-label text-on-ink-muted">{t("build.eyebrow")}</p>
          <h2 id="guide-build" className="text-section mt-4">
            {t("build.title")}
          </h2>
          <p className="text-lead mt-6 max-w-[52ch] text-pretty text-on-ink-muted">{t("build.lead")}</p>
        </div>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-start lg:gap-14">
          <ol aria-label={t("build.stepsLabel")} className="grid gap-5">
            {steps.map((step, index) => (
              <li key={step.label.es} data-reveal="" className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-t border-ink-line pt-4">
                <span className="font-mono text-sm text-brand-400">{two(index + 1)}</span>
                <div>
                  <h3 className="font-semibold">{step.label[locale]}</h3>
                  <p className="mt-1 text-pretty text-on-ink-muted">{step.note[locale]}</p>
                </div>
              </li>
            ))}
          </ol>
          <BuildStage
            className="lg:sticky lg:top-24"
            xName="GuideStage"
            steps={steps.map((step, index) => ({ label: step.label[locale], log: step.logLine[locale], success: index === steps.length - 1 }))}
            labels={{ rail: stage("rail"), log: stage("log"), play: stage("play"), pause: stage("pause") }}
          >
            <FounderScreen domain={t("stage.domain")} email={t("stage.email")} />
          </BuildStage>
        </div>
      </div>
    </section>
  );
}

// A short index of the guide's parts, as in-page links.
export function GuideIndex({ guide, locale }: GuideProps) {
  const t = useTranslations("FounderGuide");
  return (
    <section id="indice" data-x="GuideIndex" aria-labelledby="guide-index" className="relative border-t border-line bg-paper-deep text-text">
      <div className="site-container grid gap-6 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-16 lg:py-16">
        <h2 id="guide-index" className="mono-label flex items-center gap-2.5 self-start text-graphite lg:pt-5">
          <span aria-hidden="true" className="size-2 flex-none rounded-xs bg-brand-500" />
          {t("index.title")}
        </h2>
        <nav aria-label={t("index.label")}>
          <ol className="grid gap-x-8 sm:grid-cols-2">
            {guide.sections.map((section, index) => (
              <li key={section.id} className="border-t border-line">
                <a
                  href={`#${section.id}`}
                  className="group grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-3 font-semibold text-text no-underline hover:text-brand-700"
                >
                  <span className="font-mono text-sm text-brand-700">{two(index + 1)}</span>
                  <span className="text-pretty">{section.title[locale]}</span>
                  <span aria-hidden="true" className="font-mono text-brand-600 transition-transform group-hover:translate-y-0.5">
                    ↓
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}

function lineHref(link: NonNullable<FounderGuideItem["link"]>, locale: Locale) {
  const entry = serviceEntries.find((candidate) => candidate.id === link.line);
  return entry ? ({ pathname: "/servicios/[service]", params: { service: entry.slug[locale] } } as const) : null;
}

// The guide's parts: each an h2 with its intro and its items. Items that name a line of work link to
// its page with the approved link text.
export function GuideParts({ guide, locale }: GuideProps) {
  const t = useTranslations("FounderGuide");
  return (
    <>
      {guide.sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          id={section.id}
          data-x="GuideSection"
          aria-labelledby={`${section.id}-title`}
          className={cn("section-y relative border-t border-line text-text", sectionIndex % 2 === 0 ? "bg-paper" : "bg-paper-deep")}
        >
          <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
            <div data-reveal="" className="lg:sticky lg:top-24 lg:self-start">
              <Eyebrow className="text-graphite">{t("part", { number: two(sectionIndex + 1) })}</Eyebrow>
              <h2 id={`${section.id}-title`} className="font-display-tight mt-4 text-panel text-pretty">
                {section.title[locale]}
              </h2>
              <p className="text-lead mt-6 max-w-[48ch] text-pretty text-graphite">{section.intro[locale]}</p>
            </div>
            <ol className="grid gap-4">
              {section.items.map((item, index) => {
                const href = item.link ? lineHref(item.link, locale) : null;
                return (
                  <li key={item.title.es} data-reveal="">
                    <article data-x="GuideItem" className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-card border border-line bg-surface p-5 md:p-6">
                      <span className="font-mono text-sm text-brand-600">{two(index + 1)}</span>
                      <div className="min-w-0">
                        <h3 className="text-title text-pretty">{item.title[locale]}</h3>
                        <p className="mt-3 max-w-[65ch] text-pretty text-graphite">{item.body[locale]}</p>
                        {item.link && href ? (
                          <Link
                            href={href}
                            className="group mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-700 underline-offset-4 hover:underline"
                          >
                            {item.link.label[locale]}
                            <span aria-hidden="true" className="font-mono transition-transform group-hover:translate-x-1">
                              →
                            </span>
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ))}
    </>
  );
}

// The answers are in the HTML even while closed (<details>): search engines and assistants read them.
export function GuideFaq({ guide, locale }: GuideProps) {
  const t = useTranslations("FounderGuide.faq");
  return (
    <section id="preguntas" data-x="FaqList" data-surface="ink" aria-labelledby="guide-faq" className="section-y relative bg-ink text-on-ink">
      <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
        <div data-reveal="">
          <Eyebrow className="text-on-ink-muted">{t("eyebrow")}</Eyebrow>
          <h2 id="guide-faq" className="text-section mt-4">
            {t("title")}
          </h2>
          <p className="text-lead mt-6 max-w-[40ch] text-pretty text-on-ink-muted">{t("lead")}</p>
        </div>
        <div className="border-t border-ink-line">
          {guide.faqs.map((faq, index) => (
            <details key={faq.q.es} data-x="FaqItem" open={index === 0} className="group border-b border-ink-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="text-question font-semibold">{faq.q[locale]}</h3>
                <span aria-hidden="true" className="mt-0.5 font-mono text-xl leading-none text-brand-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-[65ch] pb-6 text-pretty text-on-ink-muted">{faq.a[locale]}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
