import type { ReactNode } from "react";
import { BACKGROUNDS, SECTION_Y, type Background } from "./styles";

type ColumnsBlockProps = {
  ratio: "1-1" | "2-1" | "1-2";
  background: Background;
  // The two slots (text with image or buttons), already rendered by the builder.
  left: ReactNode;
  right: ReactNode;
};

const RATIOS = {
  "1-1": "lg:grid-cols-2",
  "2-1": "lg:grid-cols-[2fr_1fr]",
  "1-2": "lg:grid-cols-[1fr_2fr]",
} as const;

// Two columns side by side on wide screens, stacked on narrow ones. data-nested tells the blocks
// inside to drop their own section background, padding and container.
export function ColumnsBlock({ ratio, background, left, right }: ColumnsBlockProps) {
  return (
    <section className={`${BACKGROUNDS[background].section} ${SECTION_Y}`}>
      <div data-nested="" className={`site-container grid gap-10 lg:gap-16 ${RATIOS[ratio]}`}>
        <div className="min-w-0">{left}</div>
        <div className="min-w-0">{right}</div>
      </div>
    </section>
  );
}
