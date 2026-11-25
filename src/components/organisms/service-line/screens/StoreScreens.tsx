import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Bar, Box, Check, Lock, Pill, ProductCard, Screen, Toggle, Token, styles } from "./parts";

// Stage screens of the store lines: Shopify, PrestaShop and WordPress. Each follows its line's six
// build steps (src/content/service-lines/<line>.ts, buildSteps[n].visualHint).

const catalog = ["oak", "graphite", "brand", "walnut", "paper", "oak"] as const;
// The products a filter leaves out (the grey ones).
const filteredOut = new Set([1, 3, 5]);

function StoreHeader() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display-tight text-sm text-text md:text-base">Taller Lumen</span>
      <Bar className="ml-auto w-7" />
      <Bar className="w-7" />
      <span className="size-3 rounded-sm border-2 border-text" />
    </div>
  );
}

// The collection banner above the products.
function StoreBanner({ className, ...props }: { className?: string; "data-in"?: string; "data-fx"?: string }) {
  return (
    <div {...props} className={cn("flex flex-none flex-col justify-center gap-1.5 rounded-lg bg-brand-950 px-3 py-3 md:py-5", className)}>
      <Bar thick tone="light" className="w-[45%]" />
      <Bar tone="light" className="w-[30%] opacity-60" />
    </div>
  );
}

// A cart drawer with one product line, what it connects to, and its button.
function CartDrawer({ children, ...props }: { children?: ReactNode; "data-in": string; "data-out": string }) {
  return (
    <div {...props} data-fx="right" className={cn(styles.paper, "absolute inset-y-0 right-0 z-20 flex w-[50%] flex-col gap-2 border-l border-line bg-paper p-2.5 shadow-drawer md:w-[46%]")}>
      <Token className="text-brand-600">{"<CartDrawer />"}</Token>
      <span className="flex items-center gap-2">
        <span className="size-7 flex-none rounded-md bg-wood-oak md:size-9" />
        <span className="flex flex-1 flex-col gap-1">
          <Bar tone="ink" className="w-[80%]" />
          <Bar className="w-[50%]" />
        </span>
      </span>
      {children}
      <span className="mt-auto block h-5 rounded-md bg-text" />
    </div>
  );
}

// Shopify: catalog, sections, filters, product page, integrations, launch.
export function ShopifyScreen() {
  return (
    <Screen>
      <div className={cn(styles.paper, "absolute inset-3 overflow-hidden rounded-lg md:inset-5")}>
        <div className="flex h-full flex-col gap-2.5 p-2.5 md:p-3.5">
          <StoreHeader />
          <StoreBanner />
          <div data-push="2" className={cn(styles.pushed, "grid grid-cols-3 gap-2")}>
            {catalog.map((tone, index) => (
              <div key={index} data-dim={filteredOut.has(index) ? "2" : undefined} data-undim={filteredOut.has(index) ? "3" : undefined} className="relative">
                <ProductCard tone={tone} />
                <span className="absolute top-2 right-2 flex gap-0.5">
                  <span className="size-1.5 rounded-full bg-wood-walnut" />
                  <span className="size-1.5 rounded-full bg-wood-oak" />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div data-in="2" data-fx="left" data-out="3" className="absolute top-10 bottom-2.5 left-2.5 z-10 flex w-[34%] flex-col gap-2 rounded-lg border border-line bg-surface p-2 md:top-12">
          <Token className="text-brand-600">{"<Facets />"}</Token>
          {[true, false, true].map((on, index) => (
            <span key={index} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 flex-none rounded-sm border border-text", on && "bg-text")} />
              <Bar className="flex-1" />
            </span>
          ))}
          <span className="mt-1 flex gap-1">
            <span className="size-3 rounded-full bg-wood-walnut ring-2 ring-brand-500" />
            <span className="size-3 rounded-full bg-wood-oak" />
            <span className="size-3 rounded-full bg-wood-graphite" />
          </span>
        </div>

        <div data-in="3" data-fx="pop" data-out="5" className="absolute inset-x-2.5 top-10 bottom-2.5 z-10 flex gap-3 rounded-lg border border-line bg-surface p-2.5 md:top-12 md:p-3.5">
          <span className="flex w-[42%] flex-col gap-1.5">
            <span className="flex-1 rounded-md bg-wood-oak" />
            <span className="grid grid-cols-3 gap-1">
              <span className="h-5 rounded bg-wood-oak/60" />
              <span className="h-5 rounded bg-wood-walnut/60" />
              <span className="h-5 rounded bg-paper-deep" />
            </span>
          </span>
          <span className="flex flex-1 flex-col gap-2">
            <Bar thick tone="ink" className="w-[80%]" />
            <Bar tone="muted" className="w-[35%]" />
            <span className="flex gap-1">
              <span className="h-4 w-10 rounded-full border-2 border-text" />
              <span className="h-4 w-10 rounded-full border border-field" />
            </span>
            <Pill data-lit="3" className="self-start">
              stock ✓
            </Pill>
            <span className="mt-auto block h-5 rounded-full bg-brand-500" />
          </span>
        </div>

        <CartDrawer data-in="4" data-out="5">
          <span className="mt-2 flex flex-wrap gap-1">
            {["<Inventory />", "<Invoices />", "<Shipping />", "<Payments />"].map((name) => (
              <Pill key={name} data-lit="4" className="bg-ink-high text-on-ink-muted">
                {name}
              </Pill>
            ))}
          </span>
        </CartDrawer>
      </div>

      <div data-in="1" data-fx="fade" data-out="2" className="absolute inset-3 z-10 flex flex-col gap-2.5 rounded-lg bg-ink-raised p-3 md:inset-5 md:gap-3.5 md:p-5">
        <Box part="<Header />" className="h-7" />
        <Box part="<Hero />" className={cn(styles.dragged, "h-12 bg-ink-high")} />
        <Box part="<FeaturedCollection />" className="flex-1" />
        <Box part="<Footer />" className="h-7" />
      </div>

      <div data-in="5" className="absolute inset-x-4 bottom-4 z-10 flex flex-col gap-1.5 rounded-lg border border-ink-line bg-ink-high p-2.5 md:inset-x-auto md:right-7 md:bottom-7 md:w-[60%]">
        {[
          ["/p/12", "/products/lumen"],
          ["/c/3", "/collections/lumen"],
        ].map(([from, to]) => (
          <Token key={from} className="truncate text-on-ink-muted">
            {from} <span className="text-brand-400">→ 301 →</span> {to}
          </Token>
        ))}
        <Pill data-lit="5" className="self-start">
          <Check /> purchase
        </Pill>
      </div>
    </Screen>
  );
}

// PrestaShop: server, catalog, theme, modules, payments, live.
export function PrestashopScreen() {
  const settings = ["lang", "currency", "tax", "zones"];
  const hooks = ["displayHeader", "displayProductAdditionalInfo", "displayShoppingCart", "paymentOptions"];
  return (
    <Screen>
      <div data-out="1" className="absolute inset-3 flex gap-3 md:inset-5">
        <div className="flex w-[34%] flex-col gap-2 rounded-lg border border-ink-line bg-ink-high p-2.5">
          <Token className="text-on-ink-muted">server</Token>
          {[0, 1, 2, 3].map((rack) => (
            <span key={rack} className="flex items-center gap-1.5 rounded-md border border-ink-line px-2 py-1.5">
              <span data-lit="0" className="size-2 flex-none rounded-full border border-ink-line" />
              <Bar className="flex-1" />
            </span>
          ))}
        </div>
        <Box part="<BackOffice />" className="flex flex-1 flex-col gap-3 p-3 pt-4">
          {settings.map((setting) => (
            <span key={setting} className="flex items-center gap-2">
              <Token className="w-16 text-on-ink-muted">{setting}</Token>
              <Bar className="flex-1" />
              <Toggle on="0" />
            </span>
          ))}
          <span className="mt-auto grid grid-cols-3 gap-2">
            <span className="h-10 rounded-md border border-ink-line" />
            <span className="h-10 rounded-md border border-ink-line" />
            <span className="h-10 rounded-md border border-ink-line" />
          </span>
        </Box>
      </div>

      <div data-in="1" data-fx="fade" className={cn(styles.paper, "absolute inset-3 overflow-hidden rounded-lg md:inset-5")}>
        <div className="flex h-full flex-col gap-2.5 p-2.5 md:p-3.5">
          <StoreHeader />
          <StoreBanner data-in="2" data-fx="fade" />
          <div data-push="1" className={cn(styles.pushed, "grid grid-cols-3 gap-2")}>
            {catalog.map((tone, index) => (
              <div key={index} data-dim={filteredOut.has(index) ? "1" : undefined} data-undim={filteredOut.has(index) ? "2" : undefined}>
                <ProductCard tone={tone} />
              </div>
            ))}
          </div>
        </div>
        <div data-in="1" data-fx="left" data-out="2" className="absolute top-10 bottom-2.5 left-2.5 z-10 flex w-[34%] flex-col gap-2 rounded-lg border border-line bg-surface p-2 md:top-12">
          <Token className="text-brand-600">products.csv</Token>
          {[0, 1, 2, 3].map((row) => (
            <span key={row} className="flex gap-1">
              <Bar className="w-[30%]" />
              <Bar className="w-[45%]" />
              <Bar tone="muted" className="w-[20%]" />
            </span>
          ))}
          <Token className="mt-auto text-brand-600">{"<Facets />"}</Token>
        </div>
      </div>

      <div data-in="2" data-out="3" className="absolute bottom-4 left-4 z-10 flex flex-col md:bottom-7 md:left-7">
        <Pill className="relative z-10 -mb-1 self-start bg-brand-500 text-brand-950">child-theme</Pill>
        <Pill className="ml-3 self-start bg-ink-high text-on-ink-muted">parent-theme</Pill>
      </div>

      <div data-in="3" data-out="4" className="absolute inset-3 z-10 flex flex-col gap-1.5 rounded-lg bg-ink-raised p-3 md:inset-5 md:gap-2 md:p-4">
        {hooks.map((hook) => (
          <span key={hook} className="flex items-center gap-2 rounded-md border border-dashed border-ink-line px-2 py-1.5">
            <Token className="min-w-0 flex-1 truncate text-on-ink-muted">{hook}</Token>
            <Pill data-in="3" data-fx="pop" className="bg-brand-500 text-brand-950">
              {"<Module />"}
            </Pill>
          </span>
        ))}
        <span className="mt-auto flex items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-high py-3 text-on-ink-muted">
          <Lock /> <Token>core</Token>
        </span>
      </div>

      <div data-in="4" data-out="5" className="absolute inset-x-3 bottom-3 z-10 flex flex-col gap-2 rounded-lg border border-ink-line bg-ink-high p-2.5 md:inset-x-5 md:bottom-5">
        <span className="flex flex-wrap items-center gap-1">
          {["cart", "address", "shipping", "payment"].map((step, index) => (
            <Pill key={step} data-lit={index === 3 ? "4" : undefined}>
              {step}
            </Pill>
          ))}
        </span>
        <span className="flex gap-2">
          {["zone 1", "zone 2"].map((zone) => (
            <span key={zone} className="flex flex-1 items-center gap-1.5 rounded-md border border-ink-line px-2 py-1">
              <Token className="text-on-ink-muted">{zone}</Token>
              <Bar className="flex-1" />
            </span>
          ))}
        </span>
      </div>

      <div data-in="5" data-fx="pop" className="absolute right-4 bottom-4 z-10 flex flex-col items-end gap-1.5 md:right-7 md:bottom-7">
        <span className="flex items-center gap-2 rounded-full border border-ink-line bg-ink-high px-2.5 py-1">
          <Token className="text-on-ink-muted">staging</Token>
          <Toggle on="5" />
          <Token className="text-on-ink">production</Token>
        </span>
        <Pill data-lit="5">
          <Check /> backup
        </Pill>
      </div>
    </Screen>
  );
}

// A placeholder that a real part replaces at a step: both share the same box.
function Swap({ at, className, before, after }: { at: string; className?: string; before: ReactNode; after: ReactNode }) {
  return (
    <div className={cn("relative flex-none", className)}>
      <div data-out={at} className="absolute inset-0">
        {before}
      </div>
      <div data-in={at} data-fx="fade" className="absolute inset-0">
        {after}
      </div>
    </div>
  );
}

// WordPress: theme, blocks, content, templates, store, live.
export function WordpressScreen() {
  return (
    <Screen>
      <div className="absolute inset-3 flex overflow-hidden rounded-lg border border-ink-line md:inset-5">
        <div className="flex w-10 flex-none flex-col gap-2 bg-ink p-2 md:w-14">
          <span className="size-4 rounded-full border-2 border-on-ink-muted" />
          {[0, 1, 2, 3, 4].map((item) => (
            <Bar key={item} tone={item === 1 ? "accent" : undefined} />
          ))}
        </div>
        <div className={cn(styles.paper, "flex flex-1 flex-col gap-3 p-2.5 md:p-3.5")}>
          <Swap at="2" className="h-3.5" before={<Bar className="w-[60%]" />} after={<Bar thick tone="ink" className="w-[70%]" />} />
          <Swap
            at="2"
            className="h-14 md:h-20"
            before={<span className="block h-full rounded-md bg-paper-skeleton" />}
            after={<span className="block h-full rounded-md bg-wood-oak" />}
          />
          {["<Service />", "<Testimonial />", "<Cta />"].map((block) => (
            <Box key={block} part={block} data-in="1" data-solid="2" className="flex flex-1 flex-col justify-center gap-1.5 px-2.5">
              <Bar data-in="2" tone="ink" className="w-[40%]" />
              <Bar data-in="2" className="w-[70%]" />
            </Box>
          ))}
        </div>
      </div>

      <div data-out="1" className="absolute top-5 right-5 z-10 flex w-[48%] flex-col gap-2 rounded-lg border border-ink-line bg-ink-high p-2.5 shadow-stage md:top-7 md:right-7">
        <Token className="text-brand-400">theme.json</Token>
        <span className="flex items-baseline gap-2">
          <span className="font-display-tight text-xl">Aa</span>
          <Bar className="flex-1" />
        </span>
        <span className="flex gap-1">
          <span className="size-4 rounded bg-brand-500" />
          <span className="size-4 rounded bg-brand-950" />
          <span className="size-4 rounded bg-paper" />
          <span className="size-4 rounded bg-wood-oak" />
        </span>
        <span className="flex items-end gap-1">
          {[1, 2, 3, 4].map((size) => (
            <span key={size} className="w-2 rounded-sm bg-ink-dim" style={{ height: `${size * 0.3}rem` }} />
          ))}
        </span>
      </div>

      <div data-in="1" data-fx="right" data-out="2" className="absolute top-5 right-5 z-10 grid w-[44%] grid-cols-2 gap-1.5 rounded-lg border border-ink-line bg-ink-high p-2.5 shadow-stage md:top-7 md:right-7">
        {["<Service />", "<Testimonial />", "<Cta />", "<Gallery />"].map((block) => (
          <span key={block} className="flex h-9 items-end rounded-md border border-ink-line p-1 md:h-12">
            <Token className="truncate text-on-ink-muted">{block}</Token>
          </span>
        ))}
      </div>

      <div data-in="2" data-out="3" className="absolute top-5 right-5 z-10 flex w-[44%] flex-col gap-1.5 rounded-lg border border-ink-line bg-ink-high p-2.5 shadow-stage md:top-7 md:right-7">
        <Token className="text-on-ink-muted">posts</Token>
        {[0, 1, 2, 3].map((row) => (
          <span key={row} className="flex items-center gap-1.5 border-b border-ink-line pb-1.5">
            <span className="size-4 flex-none rounded bg-ink-dim" />
            <Bar className="flex-1" />
          </span>
        ))}
      </div>

      <div data-in="3" data-out="4" className="absolute top-5 right-5 z-10 flex w-[48%] flex-col gap-1.5 rounded-lg border border-ink-line bg-ink-high p-2.5 shadow-stage md:top-7 md:right-7">
        {["single.html", "archive.html", "single-product.html"].map((template, index) => (
          <Pill key={template} data-lit={index === 0 ? "3" : undefined} className="justify-start">
            {template}
          </Pill>
        ))}
      </div>

      <div data-in="4" data-fx="fade" data-out="5" className={cn(styles.paper, "absolute inset-3 z-10 overflow-hidden rounded-lg md:inset-5")}>
        <div className="flex h-full flex-col gap-2.5 p-2.5 md:p-3.5">
          <StoreHeader />
          <StoreBanner />
          <div className="grid grid-cols-3 gap-2">
            {catalog.slice(0, 3).map((tone, index) => (
              <ProductCard key={index} tone={tone} />
            ))}
          </div>
          <div className="flex w-[45%] flex-col gap-1.5">
            {[0, 1, 2].map((field) => (
              <span key={field} className="block h-4 rounded border border-field" />
            ))}
          </div>
        </div>
        <CartDrawer data-in="4" data-out="5" />
      </div>

      <div data-in="5" className="absolute inset-x-5 bottom-5 z-10 flex items-end gap-4 rounded-lg border border-ink-line bg-ink-high p-3 md:inset-x-7 md:bottom-7">
        <span className={cn(styles.waterfall, "flex flex-1 flex-col gap-1")}>
          {[90, 70, 100, 55, 80].map((width, index) => (
            <span key={index} className="block h-1.5 rounded-full bg-brand-400/70" style={{ width: `${width}%`, marginLeft: `${index * 6}%` }} />
          ))}
        </span>
        <span className="relative flex h-10 w-16 flex-none items-end justify-center overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-16 rounded-full border-4 border-ink-dim border-t-live border-l-danger-soft" />
          <span className={cn(styles.needle, "relative block h-8 w-0.5 rounded-full bg-on-ink")} />
        </span>
        <Pill data-lit="5">
          <Check /> live
        </Pill>
      </div>
    </Screen>
  );
}
