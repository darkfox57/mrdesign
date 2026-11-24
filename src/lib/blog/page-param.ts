const MAX_PAGE = 99_999;

// ?page= from the URL: missing is the first page; anything but a canonical positive integer is
// null (a 404), so one listing never answers at several URLs.
export function parsePage(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return 1;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const page = Number(raw);
  return page <= MAX_PAGE ? page : null;
}
