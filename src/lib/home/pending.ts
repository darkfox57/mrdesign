// Two-digit numbers ("01", "02", …) for the sections that are shown, in order, so hiding a section
// (the cases while none is published) never leaves a gap in the numbering. Hidden sections get no number.
export function sectionNumbers<Id extends string>(sections: ReadonlyArray<{ id: Id; visible: boolean }>): Partial<Record<Id, string>> {
  const numbers: Partial<Record<Id, string>> = {};
  let next = 1;
  for (const section of sections) {
    if (!section.visible) continue;
    numbers[section.id] = String(next++).padStart(2, "0");
  }
  return numbers;
}
