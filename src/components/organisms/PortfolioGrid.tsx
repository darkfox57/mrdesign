import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import type { Project, ProjectTag } from "@/content/portfolio";

type PortfolioGridProps = {
  locale: Locale;
  projects: Project[];
  tagLabels: Record<ProjectTag, string>;
};

export function PortfolioGrid({ locale, projects, tagLabels }: PortfolioGridProps) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <figure>
            <Image
              src={project.image}
              alt={project.imageAlt[locale]}
              width={640}
              height={640}
              sizes="(min-width: 64rem) 24rem, (min-width: 40rem) 50vw, 100vw"
              className="aspect-square w-full rounded-card object-cover"
            />
            <figcaption className="mt-4">
              <span className="text-title block">{project.name}</span>
              <span className="mt-1 block text-sm text-graphite">
                {project.tags.map((tag) => tagLabels[tag]).join(", ")}
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
