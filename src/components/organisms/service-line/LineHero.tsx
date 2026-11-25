import { useTranslations } from "next-intl";
import { ButtonLink, buttonBase, buttonSizes, buttonVariants } from "@/components/atoms/ButtonLink";
import { BuildStage } from "@/components/motion/BuildStage";
import { HomeStageChrome } from "@/components/organisms/home/HomeStageScreen";
import type { Service } from "@/content/services";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { lineScreen } from "./screens/LineScreen";

type LineProps = { service: Service; locale: Locale };

const two = (value: number) => String(value).padStart(2, "0");

// The top of a line page: where it sits, the h1, the answer-first summary (the first thing search
// engines and assistants read), who it is for and the way to contact me. All server-rendered text.
export function LineHero({ service, locale, number }: LineProps & { number: number }) {
  const t = useTranslations("ServiceLine");
  const services = useTranslations("Services");
  const { content } = service;

  return (
    <section data-x="ServiceHero" data-surface="ink" aria-labelledby="line-title" className="relative bg-ink text-on-ink">
      <div className="site-container pt-8 pb-16 lg:pt-12 lg:pb-22">
        <nav aria-label={t("breadcrumbLabel")} data-x="Breadcrumbs" className="font-mono text-xs text-on-ink-muted">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center hover:text-on-ink">
                {t("home")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/servicios" className="inline-flex min-h-11 items-center hover:text-on-ink">
                {services("breadcrumb")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-on-ink">
              {service.name[locale]}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div className="min-w-0">
            <p className="font-mono text-caption text-on-ink-muted">{t("eyebrow", { number: two(number), name: service.name[locale] })}</p>
            <h1 id="line-title" className="text-display mt-5 wrap-break-word">
              {content.h1[locale]}
            </h1>
            <p data-x="AnswerSummary" className="text-lead mt-7 max-w-[62ch] text-pretty text-on-ink-muted">
              {content.summary[locale]}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contacto">{t("cta")}</ButtonLink>
              <a href="#faq" className={cn(buttonBase, buttonSizes.lg, buttonVariants.secondary)}>
                {t("ctaFaq")}
              </a>
            </div>
          </div>
          <aside data-x="Audience" aria-labelledby="line-audience" className="rounded-card border border-ink-line bg-ink-raised p-6 lg:p-8">
            <h2 id="line-audience" className="mono-label text-brand-400">
              {t("audienceLabel")}
            </h2>
            <p className="mt-4 text-pretty text-on-ink">{content.audience[locale]}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}

// The line's own build stage: the steps as readable text next to a screen that assembles them.
export function LineBuild({ service, locale }: LineProps) {
  const t = useTranslations("ServiceLine");
  const { Screen, host } = lineScreen(service.id);
  const steps = service.content.buildSteps;

  return (
    <section id="build" data-x="LineBuild" data-surface="ink" aria-labelledby="line-build" className="section-y relative border-t border-on-ink/10 bg-ink text-on-ink">
      <div className="site-container">
        <div data-reveal="" className="mb-10 max-w-3xl lg:mb-16">
          <p className="mono-label text-on-ink-muted">{t("build.eyebrow")}</p>
          <h2 id="line-build" className="text-section mt-4">
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
            xName="LineStage"
            steps={steps.map((step, index) => ({ label: step.label[locale], log: step.logLine[locale], success: index === steps.length - 1 }))}
            labels={{ rail: t("stage.rail"), log: t("stage.log"), play: t("stage.play"), pause: t("stage.pause") }}
            chrome={<HomeStageChrome host={host} live={steps[steps.length - 1].label[locale]} />}
          >
            <Screen />
          </BuildStage>
        </div>
      </div>
    </section>
  );
}
