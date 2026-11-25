import { describe, expect, it } from "vitest";
import { explorerReducer, fixDelay, initialExplorer, problemTag } from "./problem-explorer";

describe("initialExplorer", () => {
  it("starts on the founders' path, first problem, already solved for the server HTML", () => {
    expect(initialExplorer).toEqual({ audience: "starting", index: 0, fixed: true, run: 0 });
  });
});

describe("explorerReducer", () => {
  it("switching the audience shows its first problem, broken again", () => {
    const state = explorerReducer({ ...initialExplorer, index: 3 }, { type: "audience", audience: "existing" });
    expect(state).toEqual({ audience: "existing", index: 0, fixed: false, run: 1 });
  });

  it("picking a problem selects it and replays its fix", () => {
    const state = explorerReducer(initialExplorer, { type: "problem", index: 2 });
    expect(state).toEqual({ audience: "starting", index: 2, fixed: false, run: 1 });
  });

  it("fix marks the current problem solved", () => {
    const broken = explorerReducer(initialExplorer, { type: "problem", index: 1 });
    expect(explorerReducer(broken, { type: "fix" })).toEqual({ ...broken, fixed: true });
  });

  it("replay breaks the same problem again", () => {
    const state = explorerReducer({ audience: "existing", index: 4, fixed: true, run: 2 }, { type: "replay" });
    expect(state).toEqual({ audience: "existing", index: 4, fixed: false, run: 3 });
  });

  it("intro breaks the first view so it can fix itself on screen", () => {
    expect(explorerReducer(initialExplorer, { type: "intro" })).toEqual({ ...initialExplorer, fixed: false, run: 1 });
  });
});

describe("problemTag", () => {
  it("tags the founders' problems as ideas until the selected one is under way", () => {
    const state = { audience: "starting" as const, index: 1, fixed: true, run: 0 };
    expect(problemTag(state, 0)).toBe("idea");
    expect(problemTag(state, 1)).toBe("started");
    expect(problemTag({ ...state, fixed: false }, 1)).toBe("idea");
  });

  it("tags the existing business problems as open until the selected one is solved", () => {
    const state = { audience: "existing" as const, index: 0, fixed: true, run: 0 };
    expect(problemTag(state, 0)).toBe("solved");
    expect(problemTag(state, 2)).toBe("open");
    expect(problemTag({ ...state, fixed: false }, 0)).toBe("open");
  });
});

describe("fixDelay", () => {
  it("fixes at once with reduced motion", () => {
    expect(fixDelay("problem", true)).toBe(0);
    expect(fixDelay("audience", true)).toBe(0);
  });

  it("waits a moment so the broken state is seen first", () => {
    expect(fixDelay("problem", false)).toBeGreaterThan(0);
    expect(fixDelay("audience", false)).toBeGreaterThan(0);
    expect(fixDelay("intro", false)).toBeGreaterThan(0);
  });
});
