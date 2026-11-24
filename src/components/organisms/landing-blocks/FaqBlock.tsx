import { SECTION_Y } from "./styles";

type FaqBlockProps = {
  id: string;
  title: string;
  background: "paper" | "surface";
  items: { question: string; answer: string }[];
};

// Questions that open in place (native details, so it works without JavaScript and by keyboard).
// The route adds the matching FAQPage structured data (src/lib/visual-builder/page-data.ts).
export function FaqBlock({ id, title, background, items }: FaqBlockProps) {
  return (
    <section aria-labelledby={`${id}-title`} className={`${background === "surface" ? "bg-surface" : "bg-paper"} ${SECTION_Y}`}>
      <div className="site-container">
        <div className="mx-auto max-w-3xl">
          <h2 id={`${id}-title`} className="text-headline text-ink">
            {title}
          </h2>
          {items.length > 0 ? (
            <div className={`mt-10 divide-y divide-line rounded-card border border-line ${background === "surface" ? "bg-paper" : "bg-surface"}`}>
              {items.map((item, index) => (
                <details key={index} className="group px-5 sm:px-6">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span aria-hidden="true" className="text-2xl leading-none text-brand-600 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 whitespace-pre-line text-graphite">{item.answer}</p>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
