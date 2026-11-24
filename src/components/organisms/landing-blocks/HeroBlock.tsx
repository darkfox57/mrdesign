import { clsx } from "clsx";
import type { ReactNode } from "react";
import { BUTTON, BUTTON_VARIANTS } from "./styles";

type Link = { label: string; href: string };

type HeroBlockProps = {
  eyebrow: string;
  title: string;
  lead: string;
  primary: Link;
  secondary: Link;
  background: "paper" | "ink";
  // The side slot (text with image or a button), already rendered by the builder.
  side: ReactNode;
};

// The landing's opening: the page's only h1, a lead and up to two buttons. Links arrive localized.
export function HeroBlock({ eyebrow, title, lead, primary, secondary, background, side }: HeroBlockProps) {
  const dark = background === "ink";
  return (
    <section className={dark ? "bg-ink text-on-ink" : "bg-paper text-ink"}>
      <div className="site-container grid gap-12 py-16 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-16 lg:py-24">
        <div>
          {eyebrow ? (
            <p className={clsx("font-semibold", dark ? "text-brand-50" : "text-brand-600")}>{eyebrow}</p>
          ) : null}
          <h1 className={`text-display mt-4 ${dark ? "text-white" : "text-ink"}`}>{title}</h1>
          {lead ? <p className={`text-lead mt-6 max-w-prose ${dark ? "text-on-ink-muted" : "text-graphite"}`}>{lead}</p> : null}
          {primary.label || secondary.label ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {primary.label ? (
                <a href={primary.href} className={clsx(BUTTON, BUTTON_VARIANTS.primary)}>
                  {primary.label}
                </a>
              ) : null}
              {secondary.label ? (
                <a href={secondary.href} className={clsx(BUTTON, dark ? BUTTON_VARIANTS.outlineInverse : BUTTON_VARIANTS.secondary)}>
                  {secondary.label}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <div data-nested="">{side}</div>
      </div>
    </section>
  );
}
