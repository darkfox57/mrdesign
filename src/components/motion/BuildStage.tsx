"use client";

import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  DEFAULT_STEP_MS,
  initialStage,
  reachedSteps,
  shouldTick,
  stageReducer,
  stepStatus,
} from "@/lib/motion/build-stage";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/load";

export type BuildStageStep = {
  // Shown on the rail button.
  label: string;
  // The build log line this step adds.
  log: string;
  // A log line that reads as a success (the deploy), shown in the "live" color.
  success?: boolean;
};

export type BuildStageLabels = {
  // Accessible names of the rail group and the log.
  rail: string;
  log: string;
  play: string;
  pause: string;
};

export type BuildStageProps = {
  steps: BuildStageStep[];
  labels: BuildStageLabels;
  // The screen that assembles: server-rendered, decorative (hidden from assistive technology). It
  // reacts to the step through CSS: the stage root carries `data-step="<current>"` and
  // `data-on="0 1 … <current>"`, so a rule like `[data-on~="3"] .drawer` applies from step 3 on.
  children: ReactNode;
  // Optional frame above the screen (a browser bar, an editor tab), also decorative.
  chrome?: ReactNode;
  // Plays on its own once the stage is first on screen. It holds on the last step.
  autoplay?: boolean;
  stepMs?: number;
  // The X-ray label of the whole stage.
  xName?: string;
  className?: string;
  frameClassName?: string;
};

const two = (value: number) => String(value).padStart(2, "0");

// A build stage: a screen that assembles step by step, a rail to jump to any step, play and pause,
// and a build log. Without JavaScript, and with reduced motion, it shows the finished build. With
// motion it rewinds and plays once it is first seen, pauses while off screen or in a hidden tab,
// and stops for good as soon as the visitor picks a step.
export function BuildStage({
  steps,
  labels,
  children,
  chrome,
  autoplay = true,
  stepMs = DEFAULT_STEP_MS,
  xName = "BuildStage",
  className,
  frameClassName,
}: BuildStageProps) {
  const count = steps.length;
  const reducer = useMemo(() => stageReducer(count), [count]);
  const [state, dispatch] = useReducer(reducer, count, initialStage);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // On screen or not; the first time it is seen, autoplay starts (unless motion is reduced).
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && !started.current && autoplay && !media.matches) {
          started.current = true;
          dispatch({ type: "start" });
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    const onMotionChange = () => {
      if (media.matches) dispatch({ type: "finish" });
    };
    media.addEventListener("change", onMotionChange);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", onMotionChange);
    };
  }, [autoplay]);

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!shouldTick({ playing: state.playing, inView, pageVisible })) return;
    const timer = window.setTimeout(() => dispatch({ type: "tick" }), stepMs);
    return () => window.clearTimeout(timer);
  }, [state.playing, state.step, inView, pageVisible, stepMs]);

  const { step, playing, interacted } = state;

  return (
    <div
      ref={root}
      data-x={xName}
      data-step={step}
      data-on={reachedSteps(step)}
      data-playing={playing ? "" : undefined}
      className={cn("relative flex min-w-0 flex-col", className)}
    >
      <div aria-hidden="true" className={cn("overflow-hidden rounded-card border border-ink-line bg-ink-raised shadow-stage", frameClassName)}>
        {chrome}
        {children}
      </div>

      <div className="mt-4 flex flex-wrap items-stretch gap-3">
        {/* The rail's basis fits its steps; when the play button does not fit beside it, the button
            wraps below instead of squeezing the steps. */}
        <div role="group" aria-label={labels.rail} className="flex min-w-0 flex-[1_1_33rem] overflow-x-auto">
          {steps.map((item, index) => {
            const status = stepStatus(index, step);
            return (
              <button
                key={item.label}
                type="button"
                aria-current={status === "active" ? "step" : undefined}
                data-status={status}
                onClick={() => dispatch({ type: "pick", step: index })}
                className="flex min-h-14 min-w-22 flex-[1_1_0] cursor-pointer focus-visible:-outline-offset-2 flex-col items-start justify-center gap-1 border-t-2 border-on-ink/15 px-2.5 py-2.5 text-left text-caption font-medium text-on-ink-muted transition-colors hover:text-on-ink data-[status=active]:border-brand-500 data-[status=active]:text-on-ink data-[status=done]:border-brand-500/50 data-[status=done]:text-on-ink"
              >
                <span className="font-mono text-xs">{two(index + 1)}</span>
                {item.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "toggle" })}
          // A fixed width for both labels: switching between play and pause never rewraps the row.
          className="inline-flex min-h-14 w-32 flex-none cursor-pointer items-center justify-center rounded-control border-[1.5px] border-on-ink/30 px-3 text-caption font-semibold text-on-ink transition-colors hover:border-on-ink"
        >
          {playing ? labels.pause : labels.play}
        </button>
      </div>

      {/* Real text: readable without JavaScript. Announced only after the visitor uses the controls,
          so autoplay never talks over a screen reader. Lines of later steps keep their space
          (invisible, and out of the accessibility tree), so the stage never changes height while
          it plays and nothing around it moves. */}
      <div
        role="log"
        aria-label={labels.log}
        aria-live={interacted ? "polite" : "off"}
        className="mt-3.5 rounded-control border border-on-ink/10 bg-ink-raised px-4 py-3.5 font-mono text-xs leading-[1.9] text-on-ink-muted"
      >
        {steps.map((item, index) => (
          <p
            key={item.label}
            className={cn(
              index > step && "invisible",
              // The server-rendered log appears at once; lines added while it plays rise in.
              index <= step && (playing || interacted) && "motion-safe:animate-rise",
              item.success ? "text-live" : index === step ? "text-on-ink" : "text-on-ink-muted",
            )}
          >
            {item.log}
          </p>
        ))}
      </div>
    </div>
  );
}
