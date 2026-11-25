"use client";

import { Pending } from "@/components/atoms/Pending";
import { cn } from "@/lib/cn";
import { useSwapMotion } from "@/lib/home/motion";
import { useServiceSelection } from "./ServiceSelection";

export type ServiceLineItem = {
  name: string;
  counter: string;
  summary: string;
  when: string;
  deliverables: { text: string; pending?: string }[];
  flow: string[];
  flowLabel: string;
  keyNode: number;
  caption: string;
};

type ServiceExplorerProps = {
  lines: ServiceLineItem[];
  labels: { tabs: string; when: string; deliverables: string; flowTitle: string };
};

export function ServiceExplorer({ lines, labels }: ServiceExplorerProps) {
  const { selected, select } = useServiceSelection();
  const current = lines[selected];
  const panel = useSwapMotion<HTMLDivElement>(selected, (gsap, element) => {
    gsap.fromTo(
      element.querySelectorAll("[data-swap]"),
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" },
    );
    gsap.fromTo(element.querySelectorAll("[data-node]"), { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.07 });
    gsap.fromTo(
      element.querySelectorAll("[data-node-link]"),
      { scaleX: 0 },
      { scaleX: 1, duration: 0.3, stagger: 0.07, delay: 0.12 },
    );
  });

  return (
    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div
        data-reveal=""
        role="group"
        aria-label={labels.tabs}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1.5 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
      >
        {lines.map((line, index) => (
          <button
            key={line.name}
            type="button"
            aria-pressed={selected === index}
            onClick={() => select(index)}
            className="group flex min-h-11 flex-none cursor-pointer snap-start items-baseline gap-4 rounded-full border border-ink-line px-4 py-2.5 text-left font-display text-lg leading-tight font-semibold tracking-[-0.02em] text-on-ink-muted transition-colors hover:bg-on-ink/4 hover:text-on-ink aria-pressed:bg-ink-high aria-pressed:text-on-ink lg:min-h-14 lg:rounded-control lg:border-0 lg:px-4.5 lg:py-4 lg:text-tab"
          >
            <span className="font-mono text-xs font-medium tracking-[0.04em] opacity-80 group-aria-pressed:text-brand-500 group-aria-pressed:opacity-100">
              0{index + 1}
            </span>
            <span>{line.name}</span>
          </button>
        ))}
      </div>

      <div
        ref={panel}
        data-reveal=""
        data-service-panel=""
        aria-live="polite"
        className="rounded-card border border-ink-line bg-ink-raised p-6 md:p-8 lg:sticky lg:top-24 lg:p-10"
      >
        <p data-swap="" className="mono-label text-brand-500">
          {current.counter}
        </p>
        <h3 data-swap="" className="font-display-tight mt-3 text-panel">
          {current.name}
        </h3>
        <p data-swap="" className="mt-3.5 max-w-[56ch] text-lg">
          {current.summary}
        </p>
        <div data-swap="" className="mt-7 grid grid-cols-1 gap-6 border-t border-ink-line pt-6 md:grid-cols-2">
          <div>
            <h4 className="mono-label mb-2.5 font-medium text-on-ink-muted">{labels.when}</h4>
            <p className="text-md">{current.when}</p>
          </div>
          <div>
            <h4 className="mono-label mb-2.5 font-medium text-on-ink-muted">{labels.deliverables}</h4>
            <ul>
              {current.deliverables.map((item) => (
                <li
                  key={item.text}
                  className="relative mb-2 pl-5 text-md before:absolute before:top-[0.6em] before:left-0 before:h-0.5 before:w-2 before:bg-brand-500"
                >
                  {item.text} {item.pending ? <Pending>{item.pending}</Pending> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div data-schema="" className="mt-7 rounded-2xl border border-ink-line bg-ink p-5">
          <p className="mono-label mb-3 text-on-ink-muted">{labels.flowTitle}</p>
          <div role="img" aria-label={current.flowLabel} className="flex flex-wrap items-center gap-y-2">
            {current.flow.map((node, index) => (
              <div key={`${current.name}-${node}`} data-node="" className="flex items-center">
                <b
                  className={cn(
                    "rounded-lg border px-3 py-2.25 font-mono text-xs font-medium tracking-[0.02em] whitespace-nowrap",
                    index === current.keyNode ? "border-brand-500 bg-brand-500/8 text-brand-500" : "border-on-ink/30",
                  )}
                >
                  {node}
                </b>
                {index < current.flow.length - 1 ? (
                  <span
                    aria-hidden="true"
                    data-node-link=""
                    className="relative mx-1 h-px w-7 origin-left bg-on-ink/40 after:absolute after:-top-0.75 after:-right-px after:border-[3.5px] after:border-r-0 after:border-transparent after:border-l-on-ink/60"
                  />
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-3 text-caption text-on-ink-muted">{current.caption}</p>
        </div>
      </div>
    </div>
  );
}
