import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/atoms/ButtonLink";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { CaseList } from "@/components/organisms/CaseList";
import { ClosingCta } from "@/components/organisms/ClosingCta";
import { Link } from "@/i18n/navigation";
import type { CaseLine } from "@/lib/cases/lines";
import type { PublicCase, PublicCaseCard } from "@/lib/cases/public";
import { paragraphs } from "@/lib/cases/view";
import { cn } from "@/lib/cn";

type CaseStudyProps = { item: PublicCase; related: PublicCaseCard[]; lineLabels: Record<CaseLine, string> };

// One success case, fully server-rendered so it reads without JavaScript. Each main section carries
// data-x with its name, for the X-ray mode of the motion system.
export function CaseStudy({ item, related, lineLabels }: CaseStudyProps) {
  const t = useTranslations("Portfolio.case");
  const lines = item.lines.map((line) => lineLabels[line]);
  const story = [
    { id: "challenge", title: t("challengeTitle"), text: item.challenge },
    { id: "solution", title: t("solutionTitle"), text: item.solution },
    { id: "result", title: t("resultTitle"), text: item.result },
  ].filter((part) => part.text.trim());

  return (
    <>
      <article data-x="CaseStudy">
        <header data-x="CaseHero" className="site-container pt-12 pb-12 lg:pt-20 lg:pb-16">
          <Link href="/portafolio" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-graphite hover:text-ink">
            <span aria-hidden="true">←</span> {t("backToPortfolio")}
          </Link>
          <Eyebrow className="mt-8 text-graphite">{t("eyebrow")}</Eyebrow>
          <h1 className="text-display mt-5 max-w-5xl wrap-break-word">{item.title}</h1>
          <p className="text-lead mt-6 max-w-[62ch] text-pretty text-graphite">{item.summary}</p>
          <dl aria-label={t("factsLabel")} className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
            <div>
              <dt className="mono-label text-graphite">{t("client")}</dt>
              <dd className="mt-2 font-semibold">{item.client}</dd>
            </div>
            {lines.length > 0 ? (
              <div>
                <dt className="mono-label text-graphite">{t("lines")}</dt>
                <dd className="mt-2 font-semibold">{lines.join(" · ")}</dd>
              </div>
            ) : null}
            {item.year ? (
              <div>
                <dt className="mono-label text-graphite">{t("year")}</dt>
                <dd className="mt-2 font-semibold">{item.year}</dd>
              </div>
            ) : null}
          </dl>
        </header>

        {item.coverImageUrl ? (
          <figure data-x="CaseCover" className="site-container">
            <Image
              src={item.coverImageUrl}
              alt={item.coverImageAlt || item.title}
              width={1600}
              height={900}
              priority
              sizes="(min-width: 80rem) 72rem, 100vw"
              className="aspect-video w-full rounded-card object-cover"
            />
          </figure>
        ) : null}

        {story.length > 0 ? (
          <section data-x="CaseStory" aria-labelledby="case-story-title" className="site-container section-y">
            <h2 id="case-story-title" className="text-headline">
              {t("storyTitle")}
            </h2>
            <div className="mt-10 grid gap-10 lg:mt-14 lg:gap-14">
              {story.map((part) => (
                <div key={part.id} data-x="CaseStoryPart" className="grid gap-4 border-t border-line pt-6 lg:grid-cols-[16rem_1fr] lg:gap-12">
                  <h3 className="text-title">{part.title}</h3>
                  <div className="max-w-prose space-y-4 text-lead text-pretty">
                    {paragraphs(part.text).map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {item.metrics.length > 0 ? (
          <section
            data-x="CaseMetrics"
            data-surface="ink"
            aria-labelledby="case-metrics-title"
            className="grid-texture section-y bg-ink text-on-ink"
          >
            <div className="site-container">
              <h2 id="case-metrics-title" className="text-headline">
                {t("metricsTitle")}
              </h2>
              <ul className="mt-10 grid gap-px overflow-hidden rounded-card border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-3">
                {item.metrics.map((metric) => (
                  <li key={`${metric.label}-${metric.value}`} className="flex flex-col bg-ink-raised p-6 lg:p-8">
                    <p className="font-display-tight text-panel wrap-break-word text-brand-500">{metric.value}</p>
                    <p className="mt-3 font-semibold">{metric.label}</p>
                    <p className="mt-auto pt-5 text-sm text-on-ink-muted">
                      <span className="mono-label block">{t("metricSource")}</span>
                      <span className="mt-1 block">{metric.source}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {item.stack.length > 0 ? (
          <section data-x="CaseStack" aria-labelledby="case-stack-title" className="site-container py-16 lg:py-24">
            <h2 id="case-stack-title" className="text-headline">
              {t("stackTitle")}
            </h2>
            <ul className="mt-8 flex flex-wrap gap-2">
              {item.stack.map((tech) => (
                <li key={tech} className="rounded-full border border-line bg-surface px-4 py-2 font-mono text-sm">
                  {tech}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {item.gallery.length > 0 ? (
          <section data-x="CaseGallery" aria-labelledby="case-gallery-title" className="site-container py-16 lg:py-24">
            <h2 id="case-gallery-title" className="text-headline">
              {t("galleryTitle")}
            </h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {item.gallery.map((image) => (
                <li key={image.url}>
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={1200}
                    height={800}
                    sizes="(min-width: 80rem) 36rem, (min-width: 40rem) 50vw, 100vw"
                    className="aspect-3/2 w-full rounded-card object-cover"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {item.websiteUrl ? (
          <p data-x="CaseWebsite" className="site-container pb-16 lg:pb-24">
            <a
              href={item.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonBase, buttonSizes.lg, buttonVariants.secondary)}
            >
              {t("website")}
              <ExternalLink aria-hidden="true" className="size-4" />
              <span className="sr-only">{t("newTab")}</span>
            </a>
          </p>
        ) : null}
      </article>

      {related.length > 0 ? (
        <section data-x="CaseRelated" aria-labelledby="case-related-title" className="site-container border-t border-line pt-16 lg:pt-24">
          <h2 id="case-related-title" className="text-headline">
            {t("relatedTitle")}
          </h2>
          <div className="mt-10">
            <CaseList cases={related} lineLabels={lineLabels} titleAs="h3" />
          </div>
        </section>
      ) : null}

      <div data-x="ClosingCta">
        <ClosingCta title={t("ctaTitle")} text={t("ctaText")} button={t("ctaButton")} />
      </div>
    </>
  );
}
