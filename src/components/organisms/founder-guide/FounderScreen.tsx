import { cn } from "@/lib/cn";
import { Bar, Box, Check, Lock, Pill, ProductCard, Screen, Token, styles } from "@/components/organisms/service-line/screens/parts";

// The founder guide's stage screen: a business that starts as an idea and becomes a first version
// that sells. It follows the guide's six build steps (src/content/founder-guide.ts, buildSteps[n].
// visualHint) with the line pages' step gates (LineScreen.module.css). Decorative: BuildStage hides
// it from assistive technology. The demo domain and address are the only words that change with
// the language, so the page passes them in.

type FounderScreenProps = { domain: string; email: string };

function Cart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("size-3 flex-none", className)}>
      <path d="M3 4h2l2.4 11h10.2L20 8H6.2" />
      <circle cx="9" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </svg>
  );
}

const products = ["oak", "brand", "walnut"] as const;

export function FounderScreen({ domain, email }: FounderScreenProps) {
  return (
    <Screen>
      {/* 6. The outline of a larger next version, behind the site: it can grow. */}
      <Box part="<NextVersion />" data-in="5" data-fx="fade" className="absolute top-3 right-1.5 bottom-[25%] left-[39%] md:top-4 md:right-2.5" />

      {/* 1 and 2. The brief on a sticky note, then the chat where the first orders arrive. */}
      <div data-out="4" className="absolute top-5 bottom-3 left-3 z-10 flex w-[34%] flex-col gap-4 md:top-7 md:left-5 md:w-[32%]">
        <Box part="<Brief />" className={cn(styles.paper, "flex -rotate-1 flex-col gap-1.5 p-2.5 shadow-stage md:gap-2 md:p-3.5")}>
          <Bar thick tone="ink" className="w-[70%]" />
          <Bar className="w-[92%]" />
          <Bar tone="muted" className="w-[60%]" />
          <span data-in="1" data-fx="pop" data-lit="1" className="absolute -top-2 -right-2 rounded-full border border-ink-line bg-ink-high p-0.5">
            <Check className="size-2.5" />
          </span>
        </Box>
        <div data-in="1" className={cn(styles.phone, "flex min-h-0 flex-1 flex-col gap-1.5 bg-ink-high p-2 md:gap-2 md:p-2.5")}>
          <Token className="text-on-ink-muted">whatsapp</Token>
          {/* The chat grows from the bottom, like a real thread. */}
          <span className="mt-auto flex w-[82%] flex-col gap-1 self-start rounded-lg rounded-bl-sm border border-ink-line bg-ink-raised p-1.5">
            <Bar className="w-[90%]" />
            <Bar className="w-[55%]" />
          </span>
          <span className="flex w-[70%] flex-col gap-1 self-end rounded-lg rounded-br-sm bg-brand-950 p-1.5">
            <Bar tone="accent" className="w-[85%]" />
          </span>
          <Pill data-lit="1" className="self-end">
            <Lock /> /pay
          </Pill>
          <span className="flex w-[60%] flex-col gap-1 self-start rounded-lg rounded-bl-sm border border-ink-line bg-ink-raised p-1.5">
            <Bar className="w-[75%]" />
          </span>
        </div>
      </div>

      {/* 3 and 4. The browser on its own domain, where the first version assembles block by block. */}
      <div
        data-in="2"
        data-fx="right"
        className="absolute top-7 right-3 bottom-[28%] left-[42%] z-10 flex flex-col overflow-hidden rounded-lg border border-ink-line bg-ink-high shadow-stage md:top-9 md:right-5 md:left-[40%]"
      >
        <div className="flex items-center gap-1 border-b border-ink-line px-2 py-1.5">
          <span className="size-1.5 flex-none rounded-full bg-ink-dim" />
          <span className="size-1.5 flex-none rounded-full bg-ink-dim" />
          <span className="size-1.5 flex-none rounded-full bg-ink-dim" />
          <Token data-lit="2" className="ml-1.5 min-w-0 truncate rounded-full border border-ink-line px-1.5 py-px">
            {domain}
          </Token>
        </div>
        <div className={cn(styles.paper, "@container relative min-h-0 flex-1 overflow-hidden p-2 md:p-3")}>
          <div data-out="3" className="absolute inset-2 flex flex-col gap-2 md:inset-3">
            <Bar className="w-[40%]" />
            <span className="h-[30%] rounded-md bg-paper-skeleton" />
            <div className="grid flex-1 grid-cols-3 gap-1.5">
              {products.map((tone) => (
                <span key={tone} className="rounded-md bg-paper-skeleton" />
              ))}
            </div>
          </div>
          <div className="flex h-full flex-col gap-2 md:gap-2.5">
            <div data-in="3" className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-brand-500" />
              <Bar tone="ink" className="w-10" />
              <Pill data-in="4" data-fx="pop" data-lit="5" className="ml-auto">
                <Cart /> 1
              </Pill>
            </div>
            <div data-in="3" className="flex flex-col gap-1.5" style={{ transitionDelay: "0.15s" }}>
              <Bar thick tone="ink" className="w-[85%]" />
              <Bar className="w-[60%]" />
            </div>
            <div className="grid min-h-0 grid-cols-2 gap-1.5 @[14rem]:grid-cols-3">
              {products.map((tone, index) => (
                <ProductCard
                  key={tone}
                  tone={tone}
                  data-in="3"
                  data-fx="pop"
                  className={cn(index === 2 && "hidden @[14rem]:flex")}
                  style={{ transitionDelay: `${0.3 + index * 0.12}s` }}
                />
              ))}
            </div>
            <span data-in="3" className="mt-auto block h-4 w-16 flex-none rounded-full bg-brand-500 md:h-5 md:w-20" style={{ transitionDelay: "0.65s" }} />
          </div>
        </div>
      </div>

      {/* 3. A logo mark and a professional address on the new domain. */}
      <Box part="<Brand />" data-in="2" data-out="5" className="absolute right-3 bottom-3 left-[42%] flex h-[19%] items-center gap-2 px-2.5 md:right-5 md:left-[40%]">
        <span className="grid size-6 flex-none place-items-center rounded-md bg-brand-500 md:size-7">
          <span className="size-2.5 rounded-full bg-ink" />
        </span>
        <Token className="min-w-0 truncate text-on-ink-muted">{email}</Token>
      </Box>

      {/* 5. The checkout attaches to the products and links to a generic payment block. */}
      <Box
        part="<Checkout />"
        data-in="4"
        data-fx="left"
        data-solid="5"
        className="absolute top-5 bottom-[calc(19%+2.5rem)] left-3 z-20 flex w-[34%] flex-col gap-1.5 bg-ink-high p-2.5 md:top-7 md:left-5 md:w-[32%] md:gap-2 md:p-3"
      >
        <span className="flex items-center gap-1.5">
          <span className="size-3 flex-none rounded-sm bg-wood-oak" />
          <Bar className="flex-1" />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 flex-none rounded-sm bg-brand-400" />
          <Bar className="flex-1" />
        </span>
        <Bar tone="accent" className="w-[45%]" />
        <span className="flex items-center gap-1.5 border-t border-ink-line pt-1.5 text-on-ink-muted">
          <Lock />
          <Bar className="flex-1" />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 flex-none rounded-full border-2 border-brand-400" />
          <Bar className="w-[70%]" />
        </span>
        <span className="mt-auto block h-4 flex-none rounded-md bg-brand-500 md:h-5" />
      </Box>
      <span data-in="4" data-lit="5" className="absolute bottom-[calc(19%+0.75rem)] left-[calc(0.75rem+17%)] z-10 h-7 w-0 border-l-2 border-dashed border-brand-400 md:left-[calc(1.25rem+16%)]" />
      <Box part="<Payments />" data-in="4" data-solid="5" className="absolute bottom-3 left-3 z-10 flex h-[19%] w-[34%] items-center gap-1.5 px-2.5 md:left-5 md:w-[32%]">
        <Lock className="text-brand-400" />
        <Bar className="flex-1" />
        <Bar className="w-[25%]" />
      </Box>

      {/* 6. Analytics: a line trending up and one event, the first order. No numbers, no dates. */}
      <Box part="<Analytics />" data-in="5" data-solid="5" className="absolute right-3 bottom-3 left-[42%] h-[19%] md:right-5 md:left-[40%]">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="absolute inset-x-2.5 top-3 bottom-2 h-[calc(100%-1.25rem)] w-[calc(100%-1.25rem)] overflow-visible text-brand-400">
          <path d="M0 27L16 24L30 25L46 19L62 16L78 11L100 5" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="absolute top-[42%] left-[66%] size-2 -translate-1/2 rounded-full bg-live" />
        <Pill data-lit="5" className="absolute top-1.5 right-2">
          order
        </Pill>
      </Box>
    </Screen>
  );
}
