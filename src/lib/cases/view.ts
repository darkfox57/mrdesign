import type { CaseImage, CaseMetric } from "@/lib/admin/case-form";
import { CASE_LINES, type CaseLine } from "./lines";

// Mapping from stored case columns to what the public pages render. Pure: no data access.

const hasStrings = (value: unknown, keys: string[]): value is Record<string, string> =>
  typeof value === "object" && value !== null && keys.every((key) => typeof (value as Record<string, unknown>)[key] === "string");

// The metrics JSON column. A malformed column reads as no metrics instead of failing the page.
export function caseMetrics(value: unknown): CaseMetric[] {
  if (!Array.isArray(value) || !value.every((item) => hasStrings(item, ["label", "value", "source"]))) return [];
  return value.map(({ label, value: figure, source }) => ({ label, value: figure, source }));
}

// The gallery JSON column, read the same way.
export function caseGallery(value: unknown): CaseImage[] {
  if (!Array.isArray(value) || !value.every((item) => hasStrings(item, ["url", "alt"]))) return [];
  return value.map(({ url, alt }) => ({ url, alt }));
}

// The known line ids of a case, in display order.
export function caseLines(lines: readonly string[]): CaseLine[] {
  return CASE_LINES.filter((line) => lines.includes(line));
}

// The plain-text fields (challenge, solution, result) keep their paragraphs: blank lines split them.
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

// The portfolio index was a static page before cases existed: if the database cannot answer, it
// reports the error and shows the static grid instead of failing the whole page.
export async function casesOrEmpty<C>(load: () => Promise<C[]>, report: (error: unknown) => void = console.error): Promise<C[]> {
  try {
    return await load();
  } catch (error) {
    report(error);
    return [];
  }
}

// The portfolio index lists the published cases; while there is none it keeps the static project
// grid, so the page is never empty.
export function portfolioView<C, P>(cases: C[], projects: P[]): { kind: "cases"; cases: C[] } | { kind: "projects"; projects: P[] } {
  return cases.length > 0 ? { kind: "cases", cases } : { kind: "projects", projects };
}
