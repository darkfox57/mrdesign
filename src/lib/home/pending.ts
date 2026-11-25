import { SHOW_PENDING_CONTENT } from "@/content/home";

// Leaves out every item that carries pending content (a `pending` placeholder), unless pending
// content is published. The item goes as a whole, so no sentence or card is left half-empty.
export function withoutPending<T extends { pending?: unknown }>(items: readonly T[], showPending = SHOW_PENDING_CONTENT): T[] {
  return showPending ? [...items] : items.filter((item) => item.pending === undefined);
}

// Two-digit numbers ("01", "02", …) for the sections that are shown, in order, so hiding a section
// never leaves a gap in the numbering. Hidden sections get no number.
export function sectionNumbers<Id extends string>(sections: ReadonlyArray<{ id: Id; visible: boolean }>): Partial<Record<Id, string>> {
  const numbers: Partial<Record<Id, string>> = {};
  let next = 1;
  for (const section of sections) {
    if (!section.visible) continue;
    numbers[section.id] = String(next++).padStart(2, "0");
  }
  return numbers;
}
