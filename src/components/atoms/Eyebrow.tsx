import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Small monospaced label above a title, led by an accent square. The color follows the surface.
export function Eyebrow({ children, className, mark = "accent" }: { children: ReactNode; className?: string; mark?: "accent" | "ink" }) {
  return (
    <p className={cn("mono-label flex items-center gap-2.5", className)}>
      <span aria-hidden="true" className={cn("size-2 flex-none rounded-xs", mark === "accent" ? "bg-brand-500" : "bg-ink")} />
      {children}
    </p>
  );
}
