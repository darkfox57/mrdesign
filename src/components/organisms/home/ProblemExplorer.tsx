"use client";

import { useTranslations } from "next-intl";
import { Fragment, useEffect, useReducer, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { explorerReducer, fixDelay, initialExplorer, problemTag, type AudienceId } from "@/lib/home/problem-explorer";
import { prefersReducedMotion } from "@/lib/motion/load";
import styles from "./ProblemExplorer.module.css";

export type ExplorerProblem = {
  title: string;
  problem: string;
  solution: string;
  result: string;
  line: { name: string; slug: string };
  nodes: { before: string; after: string }[];
};

const audienceIds: AudienceId[] = ["starting", "existing"];
const two = (value: number) => String(value).padStart(2, "0");

// "¿Te suena alguno de estos problemas?" with its two paths (S7, S8). The server renders the first
// founder problem already solved, so every text is there without JavaScript. With motion, the
// diagram breaks and fixes itself the first time it is seen and on every pick.
export function ProblemExplorer({ paths }: { paths: Record<AudienceId, ExplorerProblem[]> }) {
  const t = useTranslations("Home.problems");
  const [state, dispatch] = useReducer(explorerReducer, initialExplorer);
  const delay = useRef(0);
  // Nothing is announced for the intro animation, which plays on its own: only after a pick.
  const [interacted, setInteracted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const act = (action: Parameters<typeof explorerReducer>[1], reason: Parameters<typeof fixDelay>[0]) => {
    delay.current = fixDelay(reason, prefersReducedMotion());
    setInteracted(true);
    dispatch(action);
  };

  // The first time the panel is on screen, its fix plays once (unless motion is reduced).
  useEffect(() => {
    const element = panel.current;
    if (!element || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        delay.current = fixDelay("intro", false);
        dispatch({ type: "intro" });
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (state.fixed) return;
    const timer = window.setTimeout(() => dispatch({ type: "fix" }), delay.current);
    return () => window.clearTimeout(timer);
  }, [state.run, state.fixed]);

  const starting = state.audience === "starting";
  const list = paths[state.audience];
  const problem = list[state.index] ?? list[0];
  const step = starting ? 0.45 : 0.25;

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex min-w-0 flex-[1_1_21rem] flex-col gap-4.5">
        <div className="flex flex-col gap-2.5">
          <span id="problems-audience" className="font-mono text-xs text-on-ink-muted">
            {t("audienceLabel")}
          </span>
          <div role="group" aria-labelledby="problems-audience" className="flex flex-wrap gap-1.5 self-start rounded-[1.75rem] border border-ink-line p-1.5">
            {audienceIds.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === state.audience}
                onClick={() => act({ type: "audience", audience: id }, "audience")}
                className="min-h-11 cursor-pointer rounded-full px-4.5 text-sm font-semibold text-on-ink-muted transition-colors hover:text-on-ink aria-pressed:bg-on-ink aria-pressed:text-text"
              >
                {t(`audiences.${id}`)}
              </button>
            ))}
          </div>
        </div>

        <div role="group" aria-label={t("listLabel")} className="flex flex-col gap-2.5">
          {list.map((item, index) => {
            const on = index === state.index;
            return (
              <button
                key={item.title}
                type="button"
                aria-pressed={on}
                onClick={() => act({ type: "problem", index }, "problem")}
                className="group grid min-h-18 w-full cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[0.875rem] border border-ink-line px-4.5 py-4 text-left font-medium text-on-ink-muted transition-colors hover:border-on-ink/30 hover:text-on-ink aria-pressed:border-brand-500 aria-pressed:bg-ink-high aria-pressed:text-on-ink"
              >
                <span className="font-mono text-caption text-brand-400">#{two(index + 1)}</span>
                <span>{item.title}</span>
                <span className="rounded-full border border-danger-soft/50 px-2 py-1 font-mono text-2xs text-danger-soft group-aria-pressed:border-brand-500 group-aria-pressed:text-brand-400">
                  {t(`tags.${problemTag(state, index)}`)}
                </span>
              </button>
            );
          })}
        </div>

        {/* The founders' path leads on to the guide for starting a business online (S8). */}
        {starting ? (
          <Link
            href="/empezar-mi-negocio-en-linea"
            data-x="StarterGuideLink"
            className="group flex flex-col gap-1.5 rounded-[0.875rem] bg-brand-950 p-4.5 text-brand-100 no-underline transition-colors hover:bg-ink-high"
          >
            <span className="font-mono text-2xs text-brand-400">{t("guide.label")}</span>
            <span className="text-md leading-snug font-semibold">
              {t("guide.text")}{" "}
              <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        ) : null}
      </div>

      <div
        ref={panel}
        data-x="ProblemDiagnosis"
        data-fixed={state.fixed ? "" : undefined}
        data-grow={starting ? "" : undefined}
        className="flex min-w-0 flex-[1.6_1_35rem] flex-col gap-7 rounded-card border border-ink-line bg-ink p-6 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <span className="text-on-ink-muted">
            {starting ? t("issueStarting", { number: two(state.index + 1) }) : t("issueExisting", { number: two(state.index + 1), count: problem.nodes.length })}
          </span>
          {/* The visible status swaps through CSS; screen readers get the final one below, once. */}
          <span aria-hidden="true">
            <span className={cn(styles.statusOpen, "inline-flex items-center gap-2", starting ? "text-pending" : "text-danger-soft")}>
              <span aria-hidden="true" className="size-2 rounded-full bg-current" />
              {t(starting ? "statusOpenStarting" : "statusOpenExisting")}
            </span>
            <span className={cn(styles.statusDone, "items-center gap-2 text-live")}>
              <span aria-hidden="true" className="size-2 rounded-full bg-current" />
              {t(starting ? "statusDoneStarting" : "statusDoneExisting")}
            </span>
          </span>
        </div>

        <span className="sr-only" aria-live={interacted ? "polite" : "off"} aria-atomic="true">
          {state.fixed ? t(starting ? "statusDoneStarting" : "statusDoneExisting") : ""}
        </span>

        <h3 className="font-display-tight text-panel text-pretty">{problem.title}</h3>

        <div aria-hidden="true" className={styles.diagram}>
          {problem.nodes.map((node, index) => (
            <Fragment key={`${state.audience}-${state.index}-${index}`}>
              <div className={cn(styles.node, index > 0 && styles.later)} style={{ transitionDelay: `${index * step}s` }}>
                <span className={styles.before}>{node.before}</span>
                <span className={styles.after}>{node.after}</span>
              </div>
              {index < problem.nodes.length - 1 ? <span className={styles.link} style={{ transitionDelay: `${index * step}s` }} /> : null}
            </Fragment>
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12.5rem),1fr))] gap-5 border-t border-on-ink/12 pt-6">
          <div className="flex flex-col gap-2">
            <span className={cn("font-mono text-xs", starting ? "text-pending" : "text-danger-soft")}>{t(starting ? "whereYouAre" : "problem")}</span>
            <p className="text-md text-on-ink">{problem.problem}</p>
          </div>
          <div className={cn(styles.fixColumn, "flex flex-col gap-2")}>
            <span className="font-mono text-xs text-brand-400">{t("solution")}</span>
            <p className="text-md text-on-ink">{problem.solution}</p>
          </div>
          <div className={cn(styles.fixColumn, "flex flex-col gap-2")}>
            <span className="font-mono text-xs text-live">{t("result")}</span>
            <p className="text-md text-on-ink">{problem.result}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={{ pathname: "/servicios/[service]", params: { service: problem.line.slug } }}
            className="inline-flex min-h-11 items-center font-semibold text-brand-400 underline-offset-4 hover:text-brand-500 hover:underline"
          >
            {t("line", { line: problem.line.name })}
          </Link>
          <button
            type="button"
            onClick={() => act({ type: "replay" }, "problem")}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-control border-[1.5px] border-on-ink/30 px-4 text-caption font-semibold text-on-ink transition-colors hover:border-on-ink"
          >
            {t("replay")}
          </button>
        </div>
      </div>
    </div>
  );
}
