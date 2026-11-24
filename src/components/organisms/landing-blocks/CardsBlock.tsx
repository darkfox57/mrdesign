import { BACKGROUNDS, SECTION_Y, type Background } from "./styles";

type CardsBlockProps = {
  id: string;
  title: string;
  intro: string;
  background: Background;
  columns: "2" | "3";
  items: { title: string; text: string }[];
};

// A section title over a grid of short cards (benefits, features, steps).
export function CardsBlock({ id, title, intro, background, columns, items }: CardsBlockProps) {
  const look = BACKGROUNDS[background];
  return (
    <section aria-labelledby={`${id}-title`} className={`${look.section} ${SECTION_Y}`}>
      <div className="site-container">
        <div className="max-w-2xl">
          <h2 id={`${id}-title`} className={`text-headline ${look.title}`}>
            {title}
          </h2>
          {intro ? <p className={`text-lead mt-4 ${look.text}`}>{intro}</p> : null}
        </div>
        {items.length > 0 ? (
          <ul className={`mt-12 grid gap-6 sm:grid-cols-2 ${columns === "3" ? "lg:grid-cols-3" : ""}`}>
            {items.map((item, index) => (
              <li key={index} className={look.card}>
                <h3 className={`text-title ${look.title}`}>{item.title}</h3>
                <p className={`mt-3 ${look.text}`}>{item.text}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
