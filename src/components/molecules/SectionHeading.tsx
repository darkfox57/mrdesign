import type { ReactNode } from "react";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  tone: "paper" | "ink";
  className?: string;
};

// Numbered eyebrow and title on the left, lead on the right (stacked below lg).
export function SectionHeading({ id, eyebrow, title, lead, tone, className }: SectionHeadingProps) {
  const muted = tone === "paper" ? "text-graphite" : "text-on-ink-muted";
  return (
    <div data-reveal="" className={cn("mb-10 grid gap-x-16 gap-y-6 lg:mb-20 lg:grid-cols-2 lg:items-end", className)}>
      <div>
        <Eyebrow className={muted}>{eyebrow}</Eyebrow>
        <h2 id={id} className="text-section mt-4">
          {title}
        </h2>
      </div>
      {lead ? <p className={cn("text-lead max-w-[52ch] text-pretty", muted)}>{lead}</p> : null}
    </div>
  );
}
