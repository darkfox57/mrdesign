"use client";

import { useState } from "react";
import { Pending } from "@/components/atoms/Pending";
import { cn } from "@/lib/cn";
import { useSwapMotion } from "@/lib/home/motion";
import styles from "./CaseBrowser.module.css";

export type CaseItem = {
  number: string;
  name: string;
  subtitle: string;
  url: string;
  sector: string;
  type: string;
  metrics: [string, string];
  parts: { label: string; title: string; text: string; pending: string }[];
};

type CaseBrowserLabels = {
  picker: string;
  next: string;
  nextPending: string;
  quote: string;
  quotePending: string;
  search: string;
  searchFields: [string, string, string];
  illustration: string;
  parts: string;
  metricPending: string;
  projectLink: string;
  linkPending: string;
  sector: string;
  type: string;
  platform: string;
  confirm: string;
  brandUse: string;
  brandPending: string;
};

const metaCell = "flex flex-col gap-1 px-5 py-3.5 text-sm";

export function CaseBrowser({ cases, labels }: { cases: CaseItem[]; labels: CaseBrowserLabels }) {
  const [selected, setSelected] = useState(0);
  const [part, setPart] = useState(0);
  const current = cases[selected];
  const currentPart = current.parts[part];

  const browser = useSwapMotion<HTMLDivElement>(selected, (gsap, element) => {
    gsap.fromTo(element.querySelector("[data-browser-body]"), { xPercent: 5, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
    gsap.fromTo(
      element.querySelectorAll("[data-case-body] > *, [data-case-meta] > *"),
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.04 },
    );
  });
  const body = useSwapMotion<HTMLDivElement>(`${selected}-${part}`, (gsap, element) => {
    if (part === 0) return; // A new case already animates from the browser above.
    gsap.fromTo(element.children, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.05 });
  });

  return (
    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <div>
        <div
          data-reveal=""
          role="group"
          aria-label={labels.picker}
          className="flex gap-3 overflow-x-auto pb-1.5 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {cases.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={selected === index}
              onClick={() => {
                setSelected(index);
                setPart(0);
              }}
              className="group flex min-h-11 flex-[0_0_min(78%,20rem)] cursor-pointer flex-col gap-1.5 rounded-2xl border border-line px-5.5 pt-5.5 pb-6 text-left transition-colors hover:border-text/40 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-on-ink lg:flex-auto"
            >
              <span className="font-mono text-xs text-brand-600 group-aria-pressed:text-brand-500">{item.number}</span>
              <span className="font-display text-case leading-[1.05] font-bold tracking-[-0.025em]">{item.name}</span>
              <span className="text-sm text-graphite group-aria-pressed:text-on-ink-muted">{item.subtitle}</span>
            </button>
          ))}
          <div className="flex-[0_0_13.75rem] rounded-2xl lg:flex-none border-[1.5px] border-dashed border-text/30 px-5.5 py-5 text-sm text-graphite">
            {labels.next}
            <br />
            <Pending>{labels.nextPending}</Pending>
          </div>
        </div>
        <div
          data-reveal=""
          className="mt-4 flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-text/30 px-5 py-4.5 text-sm text-graphite"
        >
          <span aria-hidden="true" className="font-display text-4xl leading-none text-brand-600">
            “
          </span>
          <span>
            {labels.quote} <Pending>{labels.quotePending}</Pending>
          </span>
        </div>
      </div>

      <div
        ref={browser}
        data-reveal=""
        data-stagebox=""
        data-surface="ink"
        className="overflow-hidden rounded-3xl bg-ink text-on-ink"
      >
        <div className="mx-3 mt-3 overflow-hidden rounded-t-xl border border-b-0 border-ink-line bg-ink-high md:mx-5 md:mt-5">
          <div className="flex items-center gap-2 border-b border-ink-line px-3.5 py-2.5">
            <i aria-hidden="true" className="size-2.25 rounded-full bg-on-ink/22" />
            <i aria-hidden="true" className="size-2.25 rounded-full bg-on-ink/22" />
            <i aria-hidden="true" className="size-2.25 rounded-full bg-on-ink/22" />
            <span className="ml-3 flex-1 truncate rounded-md bg-on-ink/6 px-2.5 py-1.25 font-mono text-xs text-on-ink-muted">
              {current.url}
            </span>
          </div>
          <div data-browser-body="" className={styles.body}>
            <div aria-hidden="true" className={styles.search}>
              <span className={styles.label}>{labels.search}</span>
              {labels.searchFields.map((field) => (
                <span key={field} className={styles.field}>
                  {field}
                </span>
              ))}
              <span className={styles.go} />
            </div>
            <div aria-hidden="true" className={styles.results}>
              {Array.from({ length: 6 }, (_, index) => (
                <i key={index} />
              ))}
            </div>
            <Pending className="absolute right-3.5 bottom-3 text-xs">{labels.illustration}</Pending>
          </div>
        </div>

        <div role="group" aria-label={labels.parts} className="flex flex-wrap gap-1 border-t border-ink-line px-5 pt-4">
          {current.parts.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={part === index}
              onClick={() => setPart(index)}
              className="min-h-11 cursor-pointer rounded-full border border-transparent px-4 py-2.5 text-sm font-semibold text-on-ink-muted hover:text-on-ink aria-pressed:bg-on-ink aria-pressed:text-ink"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div data-case-body="" aria-live="polite" className="grid grid-cols-1 gap-7 px-6 pt-5 pb-7 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div ref={body}>
            <p className="mono-label text-brand-500">
              {current.name} · {currentPart.label}
            </p>
            <h3 className="mt-2.5 text-xl leading-snug font-semibold tracking-[-0.01em]">{currentPart.title}</h3>
            <p className="mt-2.5 text-md text-on-ink-muted">{currentPart.text}</p>
            <p className="mt-2.5 text-md">
              <Pending>{currentPart.pending}</Pending>
            </p>
          </div>
          <div className="grid grid-cols-2 content-start gap-2.5">
            {current.metrics.map((metric) => (
              <div key={metric} className="flex flex-col gap-1.5 rounded-control border border-ink-line p-3.5">
                <b className="font-display text-2xl tracking-[-0.02em]">
                  <Pending>{labels.metricPending}</Pending>
                </b>
                <small className="text-xs leading-snug text-on-ink-muted">{metric}</small>
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-1.5 rounded-control border border-ink-line p-3.5">
              <small className="text-xs text-on-ink-muted">{labels.projectLink}</small>
              <span>
                <Pending>{labels.linkPending}</Pending>
              </span>
            </div>
          </div>
        </div>

        <div data-case-meta="" className="grid grid-cols-2 border-t border-ink-line md:grid-cols-4">
          {[
            { label: labels.sector, value: current.sector },
            { label: labels.type, value: current.type },
            { label: labels.platform, value: <Pending>{labels.confirm}</Pending> },
            { label: labels.brandUse, value: <Pending>{labels.brandPending}</Pending> },
          ].map((cell, index) => (
            <div
              key={cell.label}
              className={cn(
                metaCell,
                index % 2 === 1 && "border-l border-ink-line",
                index >= 2 && "max-md:border-t max-md:border-ink-line md:border-l",
              )}
            >
              <span className="mono-label text-on-ink-muted">{cell.label}</span>
              {cell.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
