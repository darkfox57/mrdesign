import { contactNeeds } from "@/content/home";
import type { ProjectType } from "@/lib/contact/contact-form";

// The home form lets the visitor pick several needs, but the contact action stores one project
// type. When every pick points to the same service, that service is sent; otherwise "other".
// No pick, or only picks without a service of their own ("Aún no lo sé"), also send "other".
export function projectTypeForNeeds(selectedIds: readonly string[]): ProjectType {
  const services = new Set<ProjectType>();
  for (const need of contactNeeds) {
    if (selectedIds.includes(need.id) && need.projectType !== "other") services.add(need.projectType);
  }
  return services.size === 1 ? [...services][0] : "other";
}
