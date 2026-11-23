import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { services, type ServiceId } from "@/content/services";

type PlatformPickerProps = {
  locale: Locale;
  title: string;
  lead: string;
  customLabel: string;
};

// Platform names are brands, so they are not translated.
const PLATFORMS: Array<{ id: ServiceId; label?: string }> = [
  { id: "wordpress", label: "WordPress" },
  { id: "shopify", label: "Shopify" },
  { id: "prestashop", label: "PrestaShop" },
  { id: "websites" },
];

// Plain links: the visitor picks a platform and lands on the matching service page.
export function PlatformPicker({ locale, title, lead, customLabel }: PlatformPickerProps) {
  return (
    <nav aria-labelledby="platform-picker-title" className="rounded-card bg-ink p-6 text-on-ink sm:p-8">
      <h2 id="platform-picker-title" className="text-title text-white">
        {title}
      </h2>
      <p className="mt-2 text-on-ink-muted">{lead}</p>
      <ul className="mt-6 border-t border-ink-line">
        {PLATFORMS.map(({ id, label }) => {
          const service = services.find((item) => item.id === id)!;
          return (
            <li key={id} className="border-b border-ink-line">
              <Link
                href={{ pathname: "/servicios/[service]", params: { service: service.slug[locale] } }}
                className="text-headline flex min-h-16 items-center py-3 text-white transition-colors hover:text-brand-500"
              >
                {label ?? customLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
