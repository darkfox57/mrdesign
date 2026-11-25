"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { setupHomeMotion } from "@/lib/home/home-motion";
import { loadMotion } from "@/lib/home/motion";

// Root of the homepage. It starts the scroll and pointer motion once GSAP loads, and only when the
// visitor has not asked for reduced motion; a change of that setting starts or reverts it live.
export function HomeMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
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
          teardown = setupHomeMotion(root, kit);
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
    <div ref={ref} data-home="" className="overflow-x-clip">
      {children}
    </div>
  );
}
