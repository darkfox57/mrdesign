import { clsx } from "clsx";
import { BUTTON, BUTTON_VARIANTS, SECTION_Y } from "./styles";

type CtaBlockProps = {
  id: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonHref: string;
  background: "brand" | "ink";
};

// The closing call to action: a strong title and one button, on the brand color or on ink.
export function CtaBlock({ id, title, text, buttonLabel, buttonHref, background }: CtaBlockProps) {
  return (
    <section aria-labelledby={`${id}-title`} className={`${background === "brand" ? "bg-brand-600" : "bg-ink"} ${SECTION_Y}`}>
      <div className="site-container flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2 id={`${id}-title`} className="text-headline text-white">
            {title}
          </h2>
          {text ? <p className={`text-lead mt-4 ${background === "brand" ? "text-white" : "text-on-ink-muted"}`}>{text}</p> : null}
        </div>
        {buttonLabel ? (
          <a href={buttonHref} className={clsx(BUTTON, BUTTON_VARIANTS.inverse, "shrink-0")}>
            {buttonLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}
