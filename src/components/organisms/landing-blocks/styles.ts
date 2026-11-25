// Shared looks of the landing builder blocks: the named variants an editor can pick, mapped to the
// site's tokens. Blocks never take free colors, sizes or classes (src/lib/visual-builder/validate.ts).

export type Background = "paper" | "surface" | "ink";

// Text colors are set per background so a dark section never shows dark text. Inside a Columns
// block or the hero's side (data-nested), a nested block drops its own background and padding and
// takes the colors of the section around it.
export const BACKGROUNDS: Record<Background, { section: string; title: string; text: string; card: string }> = {
  paper: {
    section: "bg-paper text-ink",
    title: "text-ink",
    text: "text-graphite",
    card: "rounded-card border border-line bg-surface p-6 sm:p-8",
  },
  surface: {
    section: "bg-surface text-ink",
    title: "text-ink",
    text: "text-graphite",
    card: "rounded-card border border-line bg-paper p-6 sm:p-8",
  },
  ink: {
    section: "bg-ink text-on-ink",
    title: "text-white",
    text: "text-on-ink-muted",
    card: "border-t-2 border-brand-500 pt-6",
  },
};

// Same look as the ButtonLink atom. Blocks link to any safe URL (not only typed routes), so they
// render a plain anchor with these classes instead of the next-intl Link.
export const BUTTON =
  "inline-flex min-h-13 items-center justify-center rounded-full px-6 font-semibold transition-colors";

export const BUTTON_VARIANTS = {
  // The accent as a background always carries ink text.
  primary: "bg-brand-500 text-ink hover:bg-brand-400",
  // Takes the text color of its section, so it reads on light and dark backgrounds alike.
  secondary: "border border-field text-current hover:border-current",
  // On dark or brand sections.
  inverse: "bg-paper text-ink hover:bg-white",
  outlineInverse: "border border-on-ink-muted text-white hover:border-white",
} as const;

export const SECTION_Y = "py-16 lg:py-24";
