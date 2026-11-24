import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  label?: string;
  // Inside a link that already has an accessible name, the logo is hidden from assistive tech.
  decorative?: boolean;
};

// The handwritten Mr. Design signature. It is a CSS mask, so its color follows `text-*` utilities.
export function Logo({ className, label = "Mr. Design", decorative = false }: LogoProps) {
  const a11y = decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label };
  return <span {...a11y} className={cn("signature inline-block h-10", className)} />;
}
