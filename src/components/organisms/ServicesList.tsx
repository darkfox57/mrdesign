import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Service } from "@/content/services";

type ServicesListProps = {
  locale: Locale;
  services: Service[];
  // Accessible name for each row link, e.g. "See details for {name}".
  linkLabel: (name: string) => string;
  headingLevel?: "h2" | "h3";
};

// Services as divided rows: the name leads, the summary explains, the whole row is the link.
export function ServicesList({ locale, services, linkLabel, headingLevel = "h3" }: ServicesListProps) {
  const Heading = headingLevel;

  return (
    <ul className="grid border-t border-line md:grid-cols-2 md:gap-x-12">
      {services.map((service) => (
        <li key={service.id} className="border-b border-line">
          <Link
            href={{ pathname: "/servicios/[service]", params: { service: service.slug[locale] } }}
            aria-label={linkLabel(service.name[locale])}
            className="group flex h-full items-start justify-between gap-6 py-7"
          >
            <span>
              <Heading className="text-title transition-colors group-hover:text-brand-600">
                {service.name[locale]}
              </Heading>
              <span className="mt-2 block text-graphite">{service.summary[locale]}</span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="mt-1 size-6 shrink-0 text-graphite transition-colors group-hover:text-brand-600"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
