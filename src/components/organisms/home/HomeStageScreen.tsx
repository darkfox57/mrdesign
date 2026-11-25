import { cn } from "@/lib/cn";
import styles from "./HomeStage.module.css";

// The demo store ("Taller Lumen") that assembles in the home's build stage. Presentational and
// decorative: BuildStage hides it from assistive technology and drives it through CSS
// (HomeStage.module.css). The build log under the stage carries the same story as real text.

export type HomeStageScreenProps = {
  store: string;
  nav: string[];
  headline: string[];
  promise: string;
  add: string;
  products: { name: string; price: string; tone: "oak" | "graphite" | "brand" }[];
  cart: { title: string; item: string; line: string; subtotal: string; total: string; checkout: string };
  checkout: { title: string; fields: { label: string; value: string; valid?: boolean }[]; pay: string };
  toast: string;
};

const columns = Array.from({ length: 12 }, (_, index) => index);

const productTones = {
  oak: "bg-wood-oak text-brand-950",
  graphite: "bg-wood-graphite text-on-ink",
  brand: "bg-brand-400 text-brand-950",
} as const;

export function ChairIcon({ className, legs = 4 }: { className?: string; legs?: 2 | 4 }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10v24h24V10z" />
      <path d="M16 34h32" />
      <path d={legs === 4 ? "M20 34l-4 20M44 34l4 20M24 34v14M40 34v14" : "M20 34l-4 20M44 34l4 20"} />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6L5 2H2" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}

// The browser bar above the screen: the address turns https and the store goes live on the last step.
export function HomeStageChrome({ host, live }: { host: string; live: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-on-ink/10 bg-ink-high px-3.5 py-2.5">
      <div className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-ink-dim" />
        <span className="size-2.5 rounded-full bg-ink-dim" />
        <span className="size-2.5 rounded-full bg-ink-dim" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-0.5 truncate rounded-lg bg-ink-raised px-3 py-1.5 font-mono text-xs text-on-ink-muted">
        <span className={cn(styles.live, "text-live")}>https://</span>
        {host}
      </div>
      <span className={cn(styles.live, "hidden items-center gap-1.5 font-mono text-2xs text-live sm:flex")}>
        <span className="size-2 rounded-full bg-live" />
        {live}
      </span>
    </div>
  );
}

export function HomeStageScreen({ store, nav, headline, promise, add, products, cart, checkout, toast }: HomeStageScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.cols}>
        {columns.map((column) => (
          <span key={column} />
        ))}
      </div>

      <div className={styles.layout}>
        <div className={cn(styles.part, styles.header)} data-part="<Header />">
          <div className={cn(styles.skeleton, styles.skeletonRow)}>
            <i className="w-20" />
            <i className="ml-auto w-10" />
            <i className="w-10" />
            <i className="w-10" />
          </div>
          <div className={cn(styles.real, "flex items-center gap-4 px-3.5")}>
            <span className="font-display-tight text-base text-on-ink">{store}</span>
            {nav.map((item, index) => (
              <span key={item} className={cn("hidden text-xs text-on-ink-muted sm:inline", index === 0 && "ml-auto")}>
                {item}
              </span>
            ))}
            <span className="relative ml-auto text-on-ink sm:ml-0">
              <CartIcon />
              <span className={styles.badge}>1</span>
            </span>
          </div>
        </div>

        <div className={cn(styles.part, styles.banner)} data-part="<Hero />">
          <div className={styles.skeleton}>
            <i className="h-5.5 w-[55%]" />
            <i className="w-[40%]" />
            <i className="mt-2 h-7 w-22" />
          </div>
          <div className={cn(styles.real, "flex items-center justify-between gap-4 rounded-[0.625rem] bg-brand-950 px-5 md:px-6")}>
            <div className="flex flex-col gap-2">
              <span className="font-display-tight text-2xl text-brand-100 md:text-3xl">
                {headline[0]}
                <br />
                {headline[1]}
              </span>
              <span className="text-xs text-brand-200">{promise}</span>
            </div>
            <ChairIcon className="size-16 flex-none text-brand-400 md:size-24" />
          </div>
        </div>

        <div className={styles.products}>
          {products.map((product) => (
            <div key={product.name} className={styles.part} data-part="<ProductCard />">
              <div className={styles.skeleton}>
                <i className="h-17 rounded-lg" />
                <i className="w-[70%]" />
                <i className="w-[40%]" />
              </div>
              <div className={cn(styles.real, "flex flex-col gap-2 p-2.5")}>
                <div className={cn("flex min-h-12 flex-1 items-center justify-center rounded-lg", productTones[product.tone])}>
                  <ChairIcon legs={2} className="size-9 md:size-11" />
                </div>
                <span className="truncate text-xs font-semibold text-on-ink md:text-caption">{product.name}</span>
                <div className="flex items-center justify-between gap-1.5">
                  <span className={cn(styles.commerce, "truncate text-2xs text-on-ink-muted md:text-xs")}>{product.price}</span>
                  <span className={cn(styles.commerce, "hidden rounded-full bg-brand-500 px-2.5 py-1 text-2xs font-semibold text-brand-950 md:inline")}>
                    {add}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.drawer}>
        <div className="flex items-center justify-between border-b border-line px-4.5 py-4">
          <span className="font-display-tight text-lg">{cart.title}</span>
          <span className="hidden font-mono text-2xs text-graphite md:inline">&lt;CartDrawer /&gt;</span>
        </div>
        <div className="flex items-center gap-3 px-4.5 py-4">
          <div className="size-13 flex-none rounded-[0.625rem] bg-wood-oak" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-caption font-semibold">{cart.item}</span>
            <span className="text-xs text-graphite">{cart.line}</span>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-3 border-t border-line px-4.5 py-4">
          <div className="flex justify-between text-sm">
            <span>{cart.subtotal}</span>
            <strong>{cart.total}</strong>
          </div>
          <span className="flex min-h-10 items-center justify-center rounded-[0.625rem] bg-text text-caption font-semibold text-paper">{cart.checkout}</span>
        </div>
      </div>

      <div className={styles.checkout}>
        <div className="flex items-center justify-between border-b border-line px-5.5 py-4">
          <span className="font-display-tight text-xl">{checkout.title}</span>
          <span className="hidden font-mono text-2xs text-graphite md:inline">&lt;CheckoutForm /&gt;</span>
        </div>
        <div className="flex flex-col gap-3 px-5.5 py-4 text-xs">
          {checkout.fields.map((field) => (
            <div key={field.label} className={cn(styles.field, "flex flex-col gap-1")}>
              <span className="text-graphite">{field.label}</span>
              <span className="flex min-h-[2.4rem] items-center justify-between rounded-[0.625rem] border border-field px-3 py-2.5">
                <span className={styles.typed}>{field.value}</span>
                {field.valid ? <span className="text-success">✓</span> : null}
              </span>
            </div>
          ))}
          <span className="mt-1 flex min-h-10.5 items-center justify-center rounded-[0.625rem] bg-brand-500 text-caption font-bold text-brand-950">
            {checkout.pay}
          </span>
        </div>
      </div>

      <div className={styles.toast}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5 9-10" />
        </svg>
        <span className="truncate">{toast}</span>
      </div>
    </div>
  );
}
