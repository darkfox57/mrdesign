import { contactIntents } from "@/content/home";
import type { ProjectType } from "@/lib/contact/contact-form";

// The intent chip the visitor picks above the home contact form preselects the form's project type.
// An intent without a service of its own, or an unknown one, sends "other".
export function projectTypeForIntent(intentId: string): ProjectType {
  return contactIntents.find((intent) => intent.id === intentId)?.projectType ?? "other";
}
