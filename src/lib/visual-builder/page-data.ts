import { BLOCKS, type BuilderPage } from "./validate";

// Reads facts out of a validated builder page for the public route: the FAQ structured data and
// the description fallback. Walks the page in order, including the blocks inside slots.

type Block = { type: string; props: Record<string, unknown> };

function* walk(blocks: readonly Block[]): Generator<Block> {
  for (const block of blocks) {
    yield block;
    for (const slotName of Object.keys(BLOCKS[block.type]?.slots ?? {})) {
      const children = block.props[slotName];
      if (Array.isArray(children)) yield* walk(children as Block[]);
    }
  }
}

type FaqItem = { question: string; answer: string };

// The FAQPage structured data of the page; null when there is no question.
export function faqJsonLd(page: BuilderPage) {
  const items = [...walk(page.content)].filter((block) => block.type === "Faq").flatMap((block) => block.props.items as FaqItem[]);
  if (items.length === 0) return null;
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function firstHeroLead(page: BuilderPage): string | undefined {
  const hero = [...walk(page.content)].find((block) => block.type === "Hero");
  const lead = hero?.props.lead;
  return typeof lead === "string" && lead.trim() !== "" ? lead : undefined;
}
