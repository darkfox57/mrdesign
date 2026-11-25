import { getLocale, getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/atoms/ButtonLink";
import { BuildStage } from "@/components/motion/BuildStage";
import { demoStore, homeBuildSteps } from "@/content/home-stage";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/home/price";
import { HomeStageChrome, HomeStageScreen } from "./HomeStageScreen";

// The hero: the headline is server-rendered text (the LCP, no client JavaScript), and next to it a
// demo store assembles in the order I work. Only the stage's controls are a client island.
export async function HomeHero() {
  const [t, locale] = await Promise.all([getTranslations("Home.hero"), getLocale() as Promise<Locale>]);
  const firstProduct = demoStore.products[0];

  return (
    <section id="inicio" data-x="Hero" data-surface="ink" aria-labelledby="t-hero" className="relative bg-ink text-on-ink">
      <div className="site-container flex flex-wrap items-center gap-14 pt-14 pb-18 lg:pt-18 lg:pb-22">
        <div className="flex min-w-0 flex-[1_1_25rem] flex-col gap-7">
          <p className="font-mono text-caption text-on-ink-muted">{t("eyebrow")}</p>
          <h1 id="t-hero" className="text-display">
            {t.rich("title", { accent: (chunks) => <span className="text-brand-500">{chunks}</span> })}
          </h1>
          <p className="text-lead max-w-[34rem] text-on-ink-muted">{t("sub")}</p>
          <div className="flex flex-wrap gap-3">
            <a href="#contacto" className={cn(buttonBase, buttonSizes.lg, buttonVariants.primary)}>
              {t("ctaPrimary")}
            </a>
            <a href="#lineas" className={cn(buttonBase, buttonSizes.lg, buttonVariants.secondary)}>
              {t("ctaLines")}
            </a>
          </div>
          <p className="font-mono text-xs text-on-ink-muted">{t("xrayHint")}</p>
        </div>

        <BuildStage
          className="flex-[1.35_1_35rem]"
          steps={homeBuildSteps.map((step, index) => ({
            label: step.label[locale],
            log: step.log[locale],
            success: index === homeBuildSteps.length - 1,
          }))}
          labels={{ rail: t("stage.rail"), log: t("stage.log"), play: t("stage.play"), pause: t("stage.pause") }}
          chrome={<HomeStageChrome host={demoStore.host} live={demoStore.live[locale]} />}
        >
          <HomeStageScreen
            store={demoStore.name}
            nav={demoStore.nav[locale]}
            headline={demoStore.headline[locale]}
            promise={demoStore.promise[locale]}
            add={demoStore.add[locale]}
            products={demoStore.products.map((product) => ({ name: product.name[locale], price: formatPrice(product.price, locale), tone: product.tone }))}
            cart={{
              title: demoStore.cart.title[locale],
              item: demoStore.cart.item[locale],
              line: `1 × ${formatPrice(firstProduct.price, locale)}`,
              subtotal: demoStore.cart.subtotal[locale],
              total: formatPrice(firstProduct.price, locale),
              checkout: demoStore.cart.checkout[locale],
            }}
            checkout={{
              title: demoStore.checkout.title[locale],
              fields: demoStore.checkout.fields.map((field) => ({ label: field.label[locale], value: field.value, valid: field.valid })),
              pay: `${demoStore.checkout.pay[locale]} ${formatPrice(firstProduct.price, locale)}`,
            }}
            toast={demoStore.toast[locale]}
          />
        </BuildStage>
      </div>
    </section>
  );
}
