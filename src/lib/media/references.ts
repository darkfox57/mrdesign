import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { isLibraryUrl } from "./cover-prefixes";

// A content save and an image delete never both win (deleteMedia in ./library.ts):
// - The save locks the MediaFile rows of the library images it references (FOR KEY SHARE) in the
//   same transaction as its write, and fails when one of them is gone.
// - The delete locks its row (FOR UPDATE), checks the usage, deletes the object and the row, and
//   commits. A save that is holding the row makes it wait, so the usage check sees that save.
// Lock order: a save locks its media rows (by id) before it writes its content row; the delete
// locks one media row and only reads content. Neither waits on the other's content lock, and saves
// do not block each other on media (KEY SHARE is shared), so the two cannot deadlock.

// The save references library images that are not in the library: deleted meanwhile, or never there.
export class MediaMissingError extends Error {
  constructor(readonly urls: string[]) {
    super(`These library images are not in the library: ${urls.join(", ")}`);
  }
}

// The library images among `urls`, once each. Anything outside the library (an external image,
// a link) is not the library's business.
export function libraryReferences(urls: Iterable<string | null | undefined>, prefixes: readonly string[]): string[] {
  const library = [...urls].filter((url): url is string => typeof url === "string" && url !== "" && isLibraryUrl(url, prefixes));
  return [...new Set(library)].sort();
}

// The src and href values of stored post HTML. sanitizePostHtml writes every attribute in double
// quotes, and a library URL (https, hex key, no "&") needs no escaping, so it appears as it is.
const URL_ATTRIBUTE = /\s(?:src|href)="([^"]*)"/gi;

export function postHtmlUrls(html: string): string[] {
  return [...html.matchAll(URL_ATTRIBUTE)].map((match) => match[1]);
}

// Locks the rows of the library images `urls` references until the transaction ends, or throws
// MediaMissingError naming the ones with no row. The URL must be the row's own: the delete's usage
// check looks for that exact text, so a variant of it (a query, "..", another case) is refused too.
export async function lockLibraryImages(tx: Prisma.TransactionClient, urls: Iterable<string | null | undefined>, prefixes: readonly string[]) {
  const wanted = libraryReferences(urls, prefixes);
  if (wanted.length === 0) return;
  const rows = await tx.$queryRaw<{ url: string }[]>`
    select url from "MediaFile" where url in (${Prisma.join(wanted)}) order by id for key share`;
  const found = new Set(rows.map((row) => row.url));
  const missing = wanted.filter((url) => !found.has(url));
  if (missing.length > 0) throw new MediaMissingError(missing);
}

// Runs a content write with its library images locked. A write that references none runs as it
// did before, with no transaction.
export async function withLibraryImages<T>(
  urls: Iterable<string | null | undefined>,
  prefixes: readonly string[],
  write: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const wanted = libraryReferences(urls, prefixes);
  if (wanted.length === 0) return write(db);
  return db.$transaction(async (tx) => {
    await lockLibraryImages(tx, wanted, prefixes);
    return write(tx);
  });
}
