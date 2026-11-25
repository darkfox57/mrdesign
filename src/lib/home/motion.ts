"use client";

import { useEffect, useRef } from "react";

// GSAP is loaded only by the homepage client components, after hydration, and never when the
// visitor asks for reduced motion. Nothing depends on it: without it the page is complete and static.
export type Gsap = typeof import("gsap").gsap;
export type ScrollTriggerApi = typeof import("gsap/ScrollTrigger").ScrollTrigger;
export type MotionKit = { gsap: Gsap; ScrollTrigger: ScrollTriggerApi };

// The design spec: if GSAP has not loaded after about 4 seconds, the page stays static.
const LOAD_TIMEOUT_MS = 4000;

let loading: Promise<MotionKit> | null = null;

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function loadMotion(): Promise<MotionKit> {
  loading ??= Promise.race([
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([core, plugin]) => {
      core.gsap.registerPlugin(plugin.ScrollTrigger);
      return { gsap: core.gsap, ScrollTrigger: plugin.ScrollTrigger };
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("GSAP load timeout")), LOAD_TIMEOUT_MS)),
  ]);
  return loading;
}

// Animates a panel when `key` changes (a new tab, case or problem), never on the first render.
// The tweens live in a gsap.context that is reverted on the next change and on unmount.
export function useSwapMotion<T extends HTMLElement>(key: string | number, animate: (gsap: Gsap, element: T) => void) {
  const ref = useRef<T>(null);
  const previous = useRef(key);
  const animateRef = useRef(animate);

  useEffect(() => {
    animateRef.current = animate;
  });

  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    let cancelled = false;
    let context: ReturnType<Gsap["context"]> | undefined;
    loadMotion()
      .then(({ gsap }) => {
        if (cancelled) return;
        context = gsap.context(() => animateRef.current(gsap, element), element);
      })
      .catch(() => {
        // No GSAP: the new content is already there, without the transition.
      });
    return () => {
      cancelled = true;
      context?.revert();
    };
  }, [key]);

  return ref;
}
