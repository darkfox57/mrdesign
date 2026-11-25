import type { Locale } from "@/i18n/routing";
import type { ServiceId } from "../services";

type Localized<T> = Record<Locale, T>;

// The copy of one line-of-work page (odd/tasks/site-build-experience.md, T5). Its id, slug and name
// live in src/content/services.ts, the registry every other part of the site reads.
export type ServiceLineContent = {
  h1: Localized<string>;
  metaTitle: Localized<string>;
  // Also the line's one-sentence summary on cards (services.ts).
  metaDescription: Localized<string>;
  // The answer-first lead under the h1: what I build, for whom, and who builds it.
  summary: Localized<string>;
  audience: Localized<string>;
  // The searches the page targets. Editorial reference only: never rendered, never a meta tag.
  keywords: Localized<string[]>;
  // `code` is the component the deliverable becomes, shown as its label.
  deliverables: { code: string; title: Localized<string>; description: Localized<string> }[];
  // Six steps of the line's build stage. `visualHint` describes what its screen shows at that step.
  buildSteps: { label: Localized<string>; note: Localized<string>; logLine: Localized<string>; visualHint: string }[];
  // `highlight` is the index of the column this line stands for.
  comparison: {
    columns: Localized<string[]>;
    rows: { label: Localized<string>; cells: Localized<string[]> }[];
    highlight: number;
  };
  faqs: { q: Localized<string>; a: Localized<string> }[];
  related: { id: ServiceId; reason: Localized<string> }[];
};
