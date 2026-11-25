import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { PublicCaseCard } from "@/lib/cases/public";
import type { CaseLine } from "@/lib/cases/lines";

export type CaseCardProps = {
  item: PublicCaseCard;
  lineLabels: Record<CaseLine, string>;
  // h2 on the portfolio index, h3 under a section heading (related cases).
  titleAs?: "h2" | "h3";
};

// One published case in a grid: cover, client, lines, title and summary. The title link covers the
// whole card and stays its accessible name.
export function CaseCard({ item, lineLabels, titleAs: Title = "h2" }: CaseCardProps) {
  return (
    <article
      data-x="CaseCard"
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-ink"
    >
      {item.coverImageUrl ? (
        // The title next to it names the case, so a cover without alt text is decorative.
        <Image
          src={item.coverImageUrl}
          alt={item.coverImageAlt ?? ""}
          width={800}
          height={600}
          sizes="(min-width: 64rem) 24rem, (min-width: 40rem) 50vw, 100vw"
          className="aspect-4/3 w-full object-cover"
        />
      ) : null}
      <div className="flex grow flex-col p-6">
        <p className="mono-label text-graphite">{item.client}</p>
        <Title className="text-title mt-3 wrap-break-word">
          <Link
            href={{ pathname: "/portafolio/[slug]", params: { slug: item.slug } }}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-brand-600"
          >
            {item.title}
          </Link>
        </Title>
        <p className="mt-3 text-graphite">{item.summary}</p>
        {item.lines.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-2 pt-5">
            {item.lines.map((line) => (
              <li key={line} className="rounded-full border border-line px-3 py-1 text-caption text-graphite">
                {lineLabels[line]}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
