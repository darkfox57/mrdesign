import { getLocale, getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/atoms/ButtonLink";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { audiences, heroLayers } from "@/content/home";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { HeroLayers } from "./HeroLayers";

const line = "block overflow-hidden pb-[0.06em]";

export async function HomeHero() {
  const [t, locale] = await Promise.all([getTranslations("Home.hero"), getLocale() as Promise<Locale>]);

  return (
    <section
      data-hero=""
      data-surface="ink"
      aria-labelledby="t-hero"
      className="grid-texture overflow-hidden bg-ink pt-12 pb-14 text-on-ink md:pt-16 lg:pt-24 lg:pb-22"
    >
      <div className="site-container">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div>
            <div data-hero-fade="">
              <Eyebrow className="text-on-ink-muted">{t("eyebrow")}</Eyebrow>
            </div>
            <h1 id="t-hero" className="text-hero mt-6">
              <span className={line}>
                <span data-hero-line="" className="inline-block">
                  {t("line1")}
                </span>
              </span>{" "}
              <span className={line}>
                <span data-hero-line="" className="inline-block">
                  {t.rich("line2", {
                    hl: (chunks) => (
                      <span
                        data-hl=""
                        className="relative inline-block text-brand-500 [--ul:1] after:absolute after:inset-x-0 after:bottom-[0.04em] after:h-[0.07em] after:origin-left after:scale-x-(--ul) after:bg-brand-500"
                      >
                        {chunks}
                      </span>
                    ),
                  })}
                </span>
              </span>{" "}
              <span className={line}>
                <span data-hero-line="" className="inline-block">
                  {t("line3")}
                </span>
              </span>
            </h1>
            <p data-hero-fade="" className="text-lead mt-7 max-w-[46ch] text-on-ink-muted">
              {t.rich("sub", { strong: (chunks) => <strong className="font-semibold text-on-ink">{chunks}</strong> })}
            </p>
            <div data-hero-fade="" className="mt-9 flex flex-wrap gap-3">
              <a
                href="#contacto"
                data-magnetic=""
                className={cn(buttonBase, buttonSizes.lg, buttonVariants.primary, "group flex-1 basis-full md:flex-none md:basis-auto")}
              >
                {t("ctaPrimary")}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
              <a
                href="#casos"
                className={cn(buttonBase, buttonSizes.lg, buttonVariants.secondary, "flex-1 basis-full md:flex-none md:basis-auto")}
              >
                {t("ctaCases")}
              </a>
            </div>
          </div>

          <HeroLayers
            legendLabel={t("layersLabel")}
            hub={{ api: t("hubApi"), systems: [t("hubPayments"), t("hubInventory"), t("hubErp"), t("hubCrm")] }}
            layers={heroLayers.map((layer, index) => ({
              number: `0${index + 1}`,
              name: layer.name[locale],
              description: layer.description[locale],
            }))}
          />
        </div>

        <ul
          data-hero-fade=""
          aria-label={t("audienceLabel")}
          className="mt-12 grid border-t border-ink-line md:grid-cols-3 lg:mt-22"
        >
          {audiences.map((audience) => (
            <li
              key={audience.title.es}
              className="flex flex-col gap-1.5 border-b border-ink-line py-3.5 md:border-b-0 md:pt-5 md:pr-6 md:pb-0 md:not-first:border-l md:not-first:pl-6"
            >
              <b className="text-lg font-semibold text-on-ink">{audience.title[locale]}</b>
              <span className="text-sm text-on-ink-muted">{audience.text[locale]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
