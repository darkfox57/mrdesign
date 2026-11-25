import { describe, expect, it } from "vitest";
import { blocksReducer, initialBlocks } from "./blocks";

describe("blocksReducer", () => {
  it("starts with a title, a paragraph and a quote", () => {
    expect(initialBlocks.blocks.map((block) => block.type)).toEqual(["title", "text", "quote"]);
  });

  it("adds a block at the end with a new id", () => {
    const state = blocksReducer(initialBlocks, { type: "add", block: "image" });
    expect(state.blocks.at(-1)).toEqual({ id: initialBlocks.nextId, type: "image" });
    expect(state.nextId).toBe(initialBlocks.nextId + 1);
    expect(new Set(state.blocks.map((block) => block.id)).size).toBe(state.blocks.length);
  });

  it("removes a block by id", () => {
    const [first] = initialBlocks.blocks;
    const state = blocksReducer(initialBlocks, { type: "remove", id: first.id });
    expect(state.blocks.map((block) => block.id)).not.toContain(first.id);
    expect(state.blocks).toHaveLength(initialBlocks.blocks.length - 1);
  });

  it("never reuses an id after a removal", () => {
    const removed = blocksReducer(initialBlocks, { type: "remove", id: initialBlocks.blocks[2].id });
    const added = blocksReducer(removed, { type: "add", block: "quote" });
    expect(added.blocks.at(-1)?.id).toBe(initialBlocks.nextId);
  });
});
