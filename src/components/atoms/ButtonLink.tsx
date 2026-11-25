import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "inverse";
  size?: "md" | "lg";
};

// Shared with plain anchors and submit buttons that need the same look (in-page links, forms).
export const buttonVariants = {
  // The accent as a background always carries ink text (about 6.3:1).
  primary: "bg-brand-500 text-ink hover:bg-brand-400",
  // Takes the text color of its surface, so it reads on paper and on ink alike.
  secondary: "border-[1.5px] border-current/30 text-current hover:border-current",
  inverse: "bg-paper text-ink hover:bg-white",
};

export const buttonSizes = {
  md: "min-h-11 px-4.5 text-md",
  lg: "min-h-13 px-6 text-base",
};

export const buttonBase =
  "inline-flex items-center justify-center gap-2.5 rounded-full font-semibold no-underline transition-colors";

export function ButtonLink({ variant = "primary", size = "lg", className, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonBase, buttonSizes[size], buttonVariants[variant], className)} {...props} />;
}
