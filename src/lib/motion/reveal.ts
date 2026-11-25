import type { MotionKit } from "./load";

// Scroll reveals for any page (src/components/motion/ScrollReveals.tsx). Mark an element with
// `data-reveal` (rises in) or `data-reveal="assemble"` (comes together like a piece being built).
// Rules:
// - the server HTML is always fully visible: the hidden start state is set here, after JavaScript
//   runs, and only for elements that start entirely below the fold (startsBelowFold), so nothing
//   already on screen, even partly, blinks;
// - only transform, opacity and filter move: no layout shift;
// - reveals use opacity (never visibility), so keyboard focus still reaches hidden elements, and a
//   focused element is revealed at once;
// - everything lives in one gsap.context: the returned cleanup reverts it to the static page.

const FROM = {
  rise: { y: 36, opacity: 0, duration: 0.8, ease: "power3.out" },
  // clearProps: once assembled, the piece keeps no filter (it would blur its text on some screens).
  assemble: { y: 60, rotation: -1.5, scale: 0.96, opacity: 0, filter: "grayscale(1)", duration: 1, ease: "power3.out", clearProps: "filter" },
} as const;

// Whether an element starts entirely below the viewport: its top at or under the bottom edge.
export function startsBelowFold(top: number, viewportHeight: number): boolean {
  return top >= viewportHeight;
}

export function setupReveals(root: HTMLElement, { gsap, ScrollTrigger }: MotionKit): () => void {
  const viewportHeight = window.innerHeight || 900;
  const belowFold = (element: Element) => startsBelowFold(element.getBoundingClientRect().top, viewportHeight);
  const reveals = new Map<HTMLElement, ReturnType<MotionKit["gsap"]["from"]>>();

  const context = gsap.context(() => {
    for (const element of Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))) {
      if (!belowFold(element)) continue;
      const kind = element.dataset.reveal === "assemble" ? "assemble" : "rise";
      const tween = gsap.from(element, { ...FROM[kind], scrollTrigger: { trigger: element, start: "top 88%", once: true } });
      reveals.set(element, tween);
    }
  }, root);

  // Keyboard focus inside an element still waiting for its reveal shows it at once.
  const onFocus = (event: FocusEvent) => {
    for (const [element, tween] of reveals) {
      if (!element.contains(event.target as Node)) continue;
      tween.scrollTrigger?.kill();
      tween.progress(1);
      reveals.delete(element);
    }
  };
  root.addEventListener("focusin", onFocus);
  root.setAttribute("data-motion", "on");
  const frame = requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    cancelAnimationFrame(frame);
    root.removeEventListener("focusin", onFocus);
    context.revert();
    root.removeAttribute("data-motion");
  };
}
