// State of the home's problems section: which path (starting a business or an existing one), which
// problem, and whether its diagram already shows the fix. `run` changes on every replay, so the
// component restarts the animation even when the same problem is picked again.

export type AudienceId = "starting" | "existing";
export type ProblemTag = "idea" | "started" | "open" | "solved";

export type ExplorerState = { audience: AudienceId; index: number; fixed: boolean; run: number };

export type ExplorerAction =
  | { type: "audience"; audience: AudienceId }
  | { type: "problem"; index: number }
  | { type: "replay" }
  | { type: "intro" }
  | { type: "fix" };

// The server renders the first founder problem already solved: no text waits for JavaScript.
export const initialExplorer: ExplorerState = { audience: "starting", index: 0, fixed: true, run: 0 };

export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case "audience":
      return { audience: action.audience, index: 0, fixed: false, run: state.run + 1 };
    case "problem":
      return { ...state, index: action.index, fixed: false, run: state.run + 1 };
    case "replay":
    case "intro":
      return { ...state, fixed: false, run: state.run + 1 };
    case "fix":
      return { ...state, fixed: true };
  }
}

export function problemTag(state: ExplorerState, index: number): ProblemTag {
  const done = index === state.index && state.fixed;
  if (state.audience === "starting") return done ? "started" : "idea";
  return done ? "solved" : "open";
}

// How long the broken (or empty) state shows before it fixes itself.
const FIX_DELAY_MS: Record<"audience" | "problem" | "intro", number> = { audience: 900, problem: 1100, intro: 900 };

export function fixDelay(reason: keyof typeof FIX_DELAY_MS, reducedMotion: boolean): number {
  return reducedMotion ? 0 : FIX_DELAY_MS[reason];
}
