// The published cases of one line of work, for its page. Pure: the page loads the cases.
export function casesForLine<C extends { lines: readonly string[] }>(cases: C[], line: string): C[] {
  return cases.filter((item) => item.lines.includes(line));
}
