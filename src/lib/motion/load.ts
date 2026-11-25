// GSAP is loaded only by the client components that animate, after hydration, and never when the
// visitor asks for reduced motion. Nothing depends on it: without it every page is complete and static.
export type Gsap = typeof import("gsap").gsap;
export type ScrollTriggerApi = typeof import("gsap/ScrollTrigger").ScrollTrigger;
export type MotionKit = { gsap: Gsap; ScrollTrigger: ScrollTriggerApi };

// If GSAP has not loaded after about 4 seconds, the page stays static.
const LOAD_TIMEOUT_MS = 4000;

let loading: Promise<MotionKit> | null = null;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function loadMotion(): Promise<MotionKit> {
  loading ??= Promise.race([
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([core, plugin]) => {
      core.gsap.registerPlugin(plugin.ScrollTrigger);
      return { gsap: core.gsap, ScrollTrigger: plugin.ScrollTrigger };
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("GSAP load timeout")), LOAD_TIMEOUT_MS)),
  ]).catch((error: unknown) => {
    // A failed load can be retried by the next page that asks.
    loading = null;
    throw error;
  });
  return loading;
}
