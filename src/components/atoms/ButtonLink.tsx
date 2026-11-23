import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "inverse";
};

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "border border-field text-ink hover:border-ink",
  inverse: "bg-paper text-ink hover:bg-white",
};

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-control px-5 font-semibold transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
