"use client";

import { useTranslations } from "next-intl";
import { useReducer } from "react";
import { blocksReducer, blockTypes, initialBlocks, type BlockType } from "@/lib/home/blocks";
import { useRemovalFocus } from "@/lib/home/focus";
import { PieceCard } from "./PieceCard";

// The contents piece: the visitor builds a demo article from blocks, the way the site's panel works.
export function ContentBlocksPiece({ texts }: { texts: Record<BlockType, string | null> }) {
  const t = useTranslations("Home.pieces");
  const [state, dispatch] = useReducer(blocksReducer, initialBlocks);
  // Removing a block keeps keyboard focus in the article.
  const { container: removalRef, willRemove } = useRemovalFocus<number>(state.blocks);

  const render = (type: BlockType) => {
    switch (type) {
      case "title":
        return <span className="font-display-tight block text-2xl">{texts.title}</span>;
      case "text":
        return <span className="block text-md text-graphite">{texts.text}</span>;
      case "image":
        return <span data-fill="" role="img" aria-label={t("content.imageLabel")} className="block h-24 rounded-xl bg-paper-deep" />;
      case "quote":
        return <span className="block py-1 pl-4 font-display text-xl font-semibold shadow-[inset_3px_0_0_var(--color-brand-500)]">{texts.quote}</span>;
    }
  };

  return (
    <PieceCard code="ContentBlocks" title={t("content.title")} description={t("content.description")} labels={{ skeleton: t("skeleton"), finished: t("finished") }}>
      <div data-reveal="assemble" className="flex flex-col gap-3.5">
        <div data-x="BlockToolbar" role="group" aria-label={t("content.toolbar")} className="flex flex-wrap gap-2">
          {blockTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => dispatch({ type: "add", block: type })}
              className="min-h-11 cursor-pointer rounded-full border border-dashed border-text/35 px-3.5 text-caption font-medium text-text hover:border-solid"
            >
              + {t(`content.blocks.${type}`)}
            </button>
          ))}
        </div>
        <div ref={removalRef} tabIndex={-1} data-x="ArticlePreview" aria-live="polite" role="group" aria-label={t("content.title")} className="flex min-h-50 flex-col gap-3 rounded-2xl border border-line bg-white p-5.5">
          {state.blocks.length === 0 ? <span className="m-auto text-sm text-graphite">{t("content.empty")}</span> : null}
          {state.blocks.map((block) => (
            <div key={block.id} className="flex items-start gap-2.5 motion-safe:animate-rise">
              <div className="min-w-0 flex-1">{render(block.type)}</div>
              <button
                type="button"
                data-remove-key={block.id}
                aria-label={t("content.remove", { block: t(`content.blocks.${block.type}`) })}
                onClick={() => {
                  willRemove(
                    state.blocks.map((item) => item.id),
                    block.id,
                  );
                  dispatch({ type: "remove", id: block.id });
                }}
                className="min-h-11 min-w-11 flex-none cursor-pointer text-caption text-graphite"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </PieceCard>
  );
}
