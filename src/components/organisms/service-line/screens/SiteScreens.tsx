import { cn } from "@/lib/cn";
import { Bar, Box, Check, Pill, Screen, Token, styles } from "./parts";

// Stage screens of the lines that build pages: websites and landing pages. Each follows its line's
// six build steps (src/content/service-lines/<line>.ts, buildSteps[n].visualHint).

// The dashed site map of the first step: the home branches into its pages.
function SiteTree() {
  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-6 w-[78%] overflow-visible text-brand-400">
      <path d="M50 0V10M17 10H83M17 10V20M50 10V20M83 10V20" fill="none" stroke="currentColor" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Websites: structure, design, content panel, SEO, performance, live.
export function WebsitesScreen() {
  return (
    <Screen>
      <div data-out="1" className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <Box part="<Home />" className="h-14 w-[38%]" />
        <SiteTree />
        <div className="grid w-full grid-cols-3 gap-3">
          <Box part="<Services />" className="h-16" />
          <Box part="<About />" className="h-16" />
          <Box part="<Contact />" className="h-16" />
        </div>
      </div>

      <div data-in="1" data-fx="fade" className="absolute inset-3 md:inset-5">
        <div className={cn(styles.shrink, "@container relative h-full")}>
          <div className={cn(styles.paper, "flex h-full flex-col gap-2.5 overflow-hidden rounded-lg p-2.5 md:gap-3 md:p-3.5")}>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-brand-500" />
              <Bar className="w-14" tone="ink" />
              <Bar className="ml-auto w-8" />
              <Bar className="w-8" />
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-brand-950 p-3 md:p-5">
              <Bar thick tone="light" className="w-[70%]" />
              <Bar tone="light" className="w-[45%] opacity-60" />
              <span className="mt-1 h-4 w-16 rounded-full bg-brand-500 md:h-5 md:w-20" />
            </div>
            <div className="grid flex-1 grid-cols-1 gap-2 @[18rem]:grid-cols-3">
              {["bg-wood-oak", "bg-paper-deep", "bg-brand-400"].map((tone) => (
                <div key={tone} className="flex flex-col gap-1.5 rounded-md border border-line p-1.5">
                  <span className={cn("h-8 rounded md:h-12", tone)} />
                  <Bar className="w-[80%]" />
                  <Bar className="w-[55%]" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-md bg-text px-2.5 py-2">
              <Bar tone="light" className="w-16 opacity-50" />
            </div>
          </div>
          <div data-in="4" data-fx="fade" className={cn(styles.phone, "pointer-events-none absolute -inset-1")} />
        </div>
      </div>

      <div data-in="2" data-fx="left" data-out="4" className="absolute inset-y-3 left-3 z-10 flex w-[44%] flex-col gap-2.5 rounded-lg border border-ink-line bg-ink-high p-2.5 shadow-stage md:inset-y-5 md:left-5 md:w-[36%] md:p-3.5">
        <Token className="text-brand-400">{"<AdminPanel />"}</Token>
        {[70, 50, 85].map((width, index) => (
          <div key={width} className="flex flex-col gap-1">
            <Bar className="w-[40%]" />
            <div className={cn("rounded-md border px-2 py-1.5", index === 0 ? "border-brand-400" : "border-ink-line")}>
              <Bar tone={index === 0 ? "accent" : undefined} style={{ width: `${width}%` }} />
            </div>
          </div>
        ))}
        <span className="mt-auto h-5 rounded-md bg-brand-500" />
      </div>

      <div data-in="3" data-out="4" className="absolute right-3 bottom-3 left-3 z-10 flex flex-col gap-1.5 rounded-lg border border-ink-line bg-ink-high p-2.5 md:right-auto md:bottom-5 md:left-5 md:w-[60%]">
        <Token className="text-live">tallerlumen.co</Token>
        <Bar thick tone="light" className="w-[75%] opacity-80" />
        <Bar className="w-[95%]" />
        <Bar className="w-[60%]" />
      </div>
      <div data-in="3" data-out="4" className="absolute top-3 right-3 z-10 hidden w-[34%] flex-col gap-1.5 rounded-lg border border-ink-line bg-ink-high p-2.5 sm:flex md:top-5 md:right-5">
        <Token className="text-on-ink-muted">sitemap.xml</Token>
        {[0, 1, 2, 3].map((row) => (
          <span key={row} className="flex items-center gap-1.5">
            <span data-lit="3" className="rounded-full border border-ink-line p-0.5">
              <Check className="size-2.5" />
            </span>
            <Bar className="flex-1" />
          </span>
        ))}
      </div>

      <div data-in="4" data-fx="grow" data-out="5" className="absolute right-6 bottom-4 left-6 z-10 h-1.5 rounded-full bg-live" />

      <Pill data-in="5" data-fx="pop" data-lit="5" className="absolute top-4 right-4 z-10">
        <Check /> POST /contact · 200
      </Pill>
    </Screen>
  );
}

// A landing page of the funnels stage: one headline, one subhead, one button.
function Offer({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      <Bar thick tone="ink" className="w-[85%]" />
      <Bar className="w-[60%]" />
      <span className="mt-1 h-4 w-16 rounded-full bg-brand-500 md:h-5 md:w-20" />
    </div>
  );
}

// Landing pages and funnels: offer, structure, form, tracking, variants, live.
export function FunnelsScreen() {
  return (
    <Screen>
      <div data-out="5" className="absolute inset-y-3 left-3 w-[58%] md:inset-y-5 md:left-5">
        <div className={cn(styles.paper, "relative flex h-full flex-col gap-2.5 overflow-hidden rounded-lg p-2.5 md:gap-3 md:p-3.5")}>
          <div className={cn(styles.strike, "flex items-center gap-2")}>
            <span className="size-2.5 rounded-full bg-brand-500" />
            <Bar className="ml-auto w-6" />
            <Bar className="w-6" />
            <Bar className="w-6" />
          </div>
          <Offer className="py-1" />

          <div className="relative flex-1">
            <div data-out="1" className="absolute inset-0 grid grid-cols-2 gap-1.5">
              {[0, 1, 2, 3].map((block) => (
                <span key={block} className="rounded-md bg-paper-skeleton" />
              ))}
            </div>
            <div data-in="1" data-out="2" className="absolute inset-0 flex flex-col gap-3 pt-2">
              <Box part="<Benefits />" className="flex-1" />
              <Box part="<Trust />" className="flex-1" />
              <Box part="<Cta />" className="h-6" />
            </div>
            <div data-in="2" className="absolute inset-0 flex flex-col justify-end gap-1.5">
              <Pill data-in="2" data-fx="pop" className="self-end bg-ink-high text-brand-400">
                utm_source
              </Pill>
              <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-2 md:p-2.5">
                {[0, 1, 2].map((field) => (
                  <span key={field} className="block h-4 rounded border border-field md:h-5" />
                ))}
                <span className="block h-4 rounded bg-brand-500 md:h-5" />
              </div>
              <Pill data-in="3" data-fx="pop" data-lit="3" className="self-end">
                generate_lead
              </Pill>
            </div>
          </div>
        </div>
      </div>

      <div data-out="4" className="absolute inset-y-3 right-3 flex w-[34%] flex-col gap-2.5 md:inset-y-5 md:right-5">
        <div data-in="2" className="flex flex-col gap-1.5 rounded-lg border border-ink-line bg-ink-high p-2">
          <Token className="text-on-ink-muted">leads</Token>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-500" />
            <Bar className="flex-1" />
          </span>
          <Bar className="w-[60%]" />
        </div>
        <div data-in="3" className="flex flex-col items-start gap-1">
          {["page_view", "form_submit", "thank_you"].map((event, index) => (
            <span key={event} className="flex flex-col items-start gap-1">
              <Pill data-lit="3">{event}</Pill>
              {index < 2 ? <span className="ml-3 h-2.5 border-l border-ink-line" /> : null}
            </span>
          ))}
          <Pill data-lit="3" className="mt-1.5">
            whatsapp_click
          </Pill>
        </div>
      </div>

      <div data-in="4" data-fx="fade" data-out="5" className="absolute inset-3 z-10 grid grid-cols-2 gap-3 bg-ink-raised md:inset-5">
        {[
          { label: "A", width: "w-[85%]" },
          { label: "B", width: "w-[55%]" },
        ].map((variant) => (
          <div key={variant.label} className={cn(styles.paper, "relative flex flex-col gap-2 rounded-lg p-2.5 pt-4")}>
            <span className="absolute top-1.5 right-2 rounded-full bg-brand-500 px-2 font-mono text-2xs font-bold text-brand-950">{variant.label}</span>
            <Bar thick tone="ink" className={variant.width} />
            <Bar className="w-[60%]" />
            <span className="h-4 w-14 rounded-full bg-brand-500" />
            <span className="mt-auto h-16 rounded-md bg-paper-skeleton" />
          </div>
        ))}
      </div>

      <div data-in="5" data-fx="pop" className="absolute inset-y-4 left-1/2 w-36 -translate-x-1/2 md:w-44">
        <div className={cn(styles.phone, styles.paper, "flex h-full flex-col gap-2 p-2.5")}>
          <Offer className="mt-3" />
          <span className="mt-auto block h-4 rounded border border-field" />
          <span className="block h-4 rounded border border-field" />
          <span className="block h-4 rounded bg-brand-500" />
        </div>
      </div>
      <Pill data-in="5" data-fx="pop" data-lit="5" className="absolute top-4 right-4 z-10">
        <Check /> new_lead
      </Pill>
    </Screen>
  );
}
