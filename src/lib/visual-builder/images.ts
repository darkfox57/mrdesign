import { isLibraryUrl } from "@/lib/media/cover-prefixes";
import { BLOCKS } from "./validate";

// Images of a validated page must come from the image library in R2: the prefixes
// coverPrefixes() lists, which next/image can load (mediaRemotePatterns in next.config.ts).

type BlockLike = { type: string; props: Record<string, unknown> };

// Every TextImage image of the page, slots included, in page order.
export function collectImageUrls(blocks: readonly unknown[]): string[] {
  const urls: string[] = [];
  for (const raw of blocks) {
    const block = raw as BlockLike;
    if (block.type === "TextImage" && typeof block.props.imageUrl === "string" && block.props.imageUrl) urls.push(block.props.imageUrl);
    for (const slotName of Object.keys(BLOCKS[block.type]?.slots ?? {})) {
      const children = block.props[slotName];
      if (Array.isArray(children)) urls.push(...collectImageUrls(children));
    }
  }
  return urls;
}

// Every string of a page at any depth: block props, slots, item lists and the root props. A
// library URL can sit in an image or in a link (a Button href, for example), and the media delete
// counts any of them as usage, so a save locks every one (src/lib/media/references.ts filters
// them down to library URLs).
export function collectPageStrings(page: unknown): string[] {
  const strings: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === "string") strings.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(page);
  return strings;
}

export function imageHostErrors(page: { content: readonly unknown[] }, prefixes: readonly string[]): string[] {
  return collectImageUrls(page.content)
    .filter((url) => !isLibraryUrl(url, prefixes))
    .map((url) => `Imagen ${url}: elige una imagen de la biblioteca.`);
}
