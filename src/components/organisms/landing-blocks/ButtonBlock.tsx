import { clsx } from "clsx";
import { BUTTON, BUTTON_VARIANTS } from "./styles";

type ButtonBlockProps = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
  align: "left" | "center";
};

// A single button. On its own it sits in the page container; inside Columns or the hero's side
// (data-nested) it follows the column.
export function ButtonBlock({ label, href, variant, align }: ButtonBlockProps) {
  return (
    <div
      className={clsx(
        "site-container flex py-4 in-data-nested:max-w-none in-data-nested:px-0 in-data-nested:py-2",
        align === "center" && "justify-center",
      )}
    >
      <a href={href} className={clsx(BUTTON, BUTTON_VARIANTS[variant])}>
        {label}
      </a>
    </div>
  );
}
