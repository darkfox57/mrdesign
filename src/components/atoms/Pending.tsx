import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Marks content that still waits for the client's data or authorization, so it is never mistaken
// for a confirmed fact. Replace the text once the data arrives (odd/tasks/nextjs-platform.md, A13).
export function Pending({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded bg-pending px-1.5 py-px align-baseline font-mono text-[0.78em] leading-[1.35] font-medium tracking-normal text-text normal-case",
        className,
      )}
    >
      {children}
    </span>
  );
}
