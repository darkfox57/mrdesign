// The "contents" piece of the home: the visitor adds and removes blocks of a demo article.

export type BlockType = "title" | "text" | "image" | "quote";
export type Block = { id: number; type: BlockType };
export type BlocksState = { blocks: readonly Block[]; nextId: number };
export type BlocksAction = { type: "add"; block: BlockType } | { type: "remove"; id: number };

export const blockTypes: readonly BlockType[] = ["title", "text", "image", "quote"];

export const initialBlocks: BlocksState = {
  blocks: [
    { id: 1, type: "title" },
    { id: 2, type: "text" },
    { id: 3, type: "quote" },
  ],
  nextId: 4,
};

export function blocksReducer(state: BlocksState, action: BlocksAction): BlocksState {
  if (action.type === "remove") return { ...state, blocks: state.blocks.filter((block) => block.id !== action.id) };
  return { blocks: [...state.blocks, { id: state.nextId, type: action.block }], nextId: state.nextId + 1 };
}
