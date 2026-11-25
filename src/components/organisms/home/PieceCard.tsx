"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Pieces.module.css";

export type PieceCardProps = {
  // The component name shown above the title, like `<ProductDetail />`.
  code: string;
  title: string;
  description: string;
  labels: { skeleton: string; finished: string };
  children: ReactNode;
  className?: string;
};

// One working piece of the home: its demo and a button that swaps it for its skeleton and back. The
// button's text says what it will show next, so it carries no pressed state.
export function PieceCard({ code, title, description, labels, children, className }: PieceCardProps) {
  const [skeleton, setSkeleton] = useState(false);

  return (
    <article
      data-skeleton={skeleton ? "" : undefined}
      className={cn(styles.piece, "flex min-w-0 flex-col gap-5 rounded-card border border-line bg-surface p-5 text-text md:p-7", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-mono text-xs text-graphite">&lt;{code} /&gt;</span>
          <h3 className="font-display-tight text-case">{title}</h3>
          <p className="text-md text-graphite">{description}</p>
        </div>
        <button
          type="button"
          data-on={skeleton ? "" : undefined}
          onClick={() => setSkeleton(!skeleton)}
          className="min-h-11 flex-none cursor-pointer rounded-full border border-text/20 px-3.5 font-mono text-xs text-text transition-colors hover:border-text data-on:bg-text data-on:text-paper"
        >
          {skeleton ? labels.finished : labels.skeleton}
        </button>
      </div>
      <div className={cn(styles.demo, "flex min-w-0 flex-1 flex-col")}>{children}</div>
    </article>
  );
}
