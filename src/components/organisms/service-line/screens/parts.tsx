import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./LineScreen.module.css";

// Building blocks of the line pages' stage screens (LineScreen.module.css explains the step gates).
// Presentational and decorative: BuildStage hides every screen from assistive technology. The only
// words on a screen are component and code names, which read the same in every language.

export { styles };

const columns = Array.from({ length: 12 }, (_, index) => index);

// The screen: a fixed-height canvas with the 12-column grid of the first steps behind its parts.
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(styles.screen, className)}>
      <div className={styles.cols}>
        {columns.map((column) => (
          <span key={column} />
        ))}
      </div>
      {children}
    </div>
  );
}

// A component box, named after its component. The label stays once the part is built: on the
// finished screen it is what tells the parts apart.
export function Box({ part, className, ...props }: ComponentProps<"div"> & { part?: string }) {
  return <div data-part={part} className={cn("relative", styles.box, className)} {...props} />;
}

// Placeholder text. Its color and height are variants: the module's styles outrank utilities.
export function Bar({
  className,
  tone,
  thick,
  ...props
}: ComponentProps<"span"> & { tone?: "accent" | "muted" | "ink" | "light"; thick?: boolean }) {
  return <span className={cn(styles.bar, tone && styles[tone], thick && styles.thick, className)} {...props} />;
}

export function Pill({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(styles.pill, className)} {...props} />;
}

export function Token({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(styles.token, className)} {...props} />;
}

// A connector; `vertical` draws it top to bottom.
export function Wire({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(styles.wire, className)} {...props} />;
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={cn("size-3 flex-none", className)}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function Lock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("size-3 flex-none", className)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function Warning({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("size-3 flex-none", className)}>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18v.5" />
    </svg>
  );
}

// A toggle switch that turns on (green) from a step on.
export function Toggle({ on }: { on: string }) {
  return (
    <span data-lit={on} className="relative inline-flex h-3 w-6 flex-none items-center rounded-full border border-ink-line bg-ink-dim px-0.5">
      <span className="size-2 rounded-full bg-current" />
    </span>
  );
}

// A small product card on a light page: a picture, a name and a price, as bars.
export function ProductCard({ tone, className, ...props }: ComponentProps<"div"> & { tone: "oak" | "walnut" | "graphite" | "brand" | "paper" }) {
  const tones = {
    oak: "bg-wood-oak",
    walnut: "bg-wood-walnut",
    graphite: "bg-wood-graphite",
    brand: "bg-brand-400",
    paper: "bg-paper-deep",
  } as const;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5 rounded-lg border border-line bg-surface p-1.5", className)} {...props}>
      <span className={cn("block h-8 rounded-md md:h-11", tones[tone])} />
      <Bar className="w-[80%]" />
      <Bar tone="muted" className="w-[45%]" />
    </div>
  );
}
