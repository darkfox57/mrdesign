"use client";

import { useState } from "react";
import { useSwapMotion } from "@/lib/home/motion";
import { cn } from "@/lib/cn";
import { useServiceSelection } from "./ServiceSelection";

export type ProblemItem = {
  title: string;
  problem: string;
  solutionTitle: string;
  solution: string;
  resultTitle: string;
  result: string;
  serviceName: string;
  serviceIndex: number;
};

type ProblemExplorerProps = {
  problems: ProblemItem[];
  labels: { list: string; problem: string; solution: string; result: string; serviceLine: string; seeHow: string };
};

const card = "relative flex flex-col gap-3.5 px-5 pt-5.5 pb-6 md:min-h-85 md:px-6 md:pt-7 md:pb-8";
const arrow =
  "absolute z-10 grid size-6.5 place-items-center rounded-full border border-ink-line bg-ink text-brand-500 max-md:-bottom-3.25 max-md:left-5 max-md:rotate-90 md:top-7.5 md:-right-3.25";

export function ProblemExplorer({ problems, labels }: ProblemExplorerProps) {
  const [selected, setSelected] = useState(0);
  const { select } = useServiceSelection();
  const current = problems[selected];
  const panel = useSwapMotion<HTMLDivElement>(selected, (gsap, element) => {
    gsap.fromTo(
      element.querySelectorAll("[data-card]"),
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, stagger: 0.1, ease: "power2.out" },
    );
    gsap.fromTo(
      element.querySelectorAll("[data-meter]"),
      { scaleX: 0 },
      { scaleX: (index: number) => (index + 1) / 3, duration: 0.7, stagger: 0.15, ease: "power2.inOut" },
    );
  });

  const steps = [
    { label: labels.problem, title: current.title, text: current.problem },
    { label: labels.solution, title: current.solutionTitle, text: current.solution },
    { label: labels.result, title: current.resultTitle, text: current.result },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div data-reveal="" role="group" aria-label={labels.list} className="flex flex-col border-t border-line">
        {problems.map((problem, index) => (
          <button
            key={problem.title}
            type="button"
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
            className="group grid min-h-14 cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)_1.5rem] items-center gap-3 border-b border-line px-1 py-5 text-left text-lg leading-tight font-semibold tracking-[-0.01em] transition-[color,padding] hover:pl-3 aria-pressed:pl-3 aria-pressed:text-brand-600 lg:text-xl"
          >
            <span className="font-mono text-xs font-medium text-graphite">0{index + 1}</span>
            <span>{problem.title}</span>
            <span
              aria-hidden="true"
              className="-translate-x-1.5 text-brand-600 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-aria-pressed:translate-x-0 group-aria-pressed:opacity-100"
            >
              →
            </span>
          </button>
        ))}
      </div>

      <div
        ref={panel}
        data-reveal=""
        data-problem-panel=""
        data-surface="ink"
        aria-live="polite"
        className="grid grid-cols-1 overflow-hidden rounded-card bg-ink text-on-ink md:grid-cols-3 lg:sticky lg:top-24"
      >
        {steps.map((step, index) => {
          const result = index === steps.length - 1;
          return (
            <article
              key={step.label}
              data-card=""
              className={cn(
                card,
                index > 0 && "max-md:border-t max-md:border-ink-line md:border-l md:border-ink-line",
                result && "bg-brand-500 text-ink",
              )}
            >
              <p className={cn("mono-label", result ? "text-brand-950" : "text-on-ink-muted")}>{step.label}</p>
              <h3 className="text-lg leading-snug font-semibold tracking-[-0.01em] lg:text-xl">{step.title}</h3>
              <p className={cn("text-md", result ? "text-brand-950" : "text-on-ink-muted")}>{step.text}</p>
              <div aria-hidden="true" className={cn("mt-auto h-0.75 overflow-hidden rounded-xs", result ? "bg-ink/15" : "bg-on-ink/12")}>
                <i
                  data-meter=""
                  className={cn("block h-full origin-left", result ? "bg-ink" : "bg-brand-500")}
                  style={{ transform: `scaleX(${(index + 1) / 3})` }}
                />
              </div>
              {result ? null : (
                <span aria-hidden="true" className={arrow}>
                  →
                </span>
              )}
            </article>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-ink-line px-6 py-4 text-sm text-on-ink-muted md:col-span-3">
          <span>
            {labels.serviceLine} <b className="text-on-ink">{current.serviceName}</b>
          </span>
          <a
            href="#servicios"
            onClick={() => select(current.serviceIndex)}
            className="inline-flex min-h-11 items-center font-semibold text-brand-500 no-underline hover:underline"
          >
            {labels.seeHow}
          </a>
        </div>
      </div>
    </div>
  );
}
