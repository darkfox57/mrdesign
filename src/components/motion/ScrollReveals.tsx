"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { loadMotion, REDUCED_MOTION_QUERY } from "@/lib/motion/load";
import { setupReveals } from "@/lib/motion/reveal";

// Wraps a page whose `data-reveal` elements rise in on scroll (src/lib/motion/reveal.ts). GSAP loads
// after hydration and only when the visitor has not asked for reduced motion; a change of that
// setting starts or reverts the reveals live. Without JavaScript the page is complete and static.
export function ScrollReveals({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    let teardown: (() => void) | undefined;
    let attempt = 0;

    const start = () => {
      const current = ++attempt;
      teardown?.();
      teardown = undefined;
      if (media.matches) return;
      loadMotion()
        .then((kit) => {
          if (current !== attempt || media.matches) return;
          teardown = setupReveals(root, kit);
        })
        .catch(() => {
          // GSAP did not load: the page stays complete and static.
        });
    };

    start();
    media.addEventListener("change", start);
    return () => {
      attempt++;
      media.removeEventListener("change", start);
      teardown?.();
    };
  }, []);

  return (
    // overflow-x-clip: elements rising in from a rotated or scaled start never widen the page.
    <div ref={ref} data-reveals="" className={className ?? "overflow-x-clip"}>
      {children}
    </div>
  );
}
