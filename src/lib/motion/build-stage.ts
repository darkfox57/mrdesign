// State of a build stage (src/components/motion/BuildStage.tsx): which step of the build is shown
// and whether it plays on its own. Pure, so the timing decisions are tested without a browser.
//
// The stage starts on its last step: that is what the server renders, what a visitor without
// JavaScript sees and what reduced motion keeps. Autoplay rewinds to the first step after mount
// ("start") and holds on the last step once it gets there.

export type StageState = {
  step: number;
  playing: boolean;
  // Whether the visitor used the controls: only then is the build log announced to screen readers.
  interacted: boolean;
};

export type StageAction =
  | { type: "start" }
  | { type: "tick" }
  | { type: "pick"; step: number }
  | { type: "toggle" }
  | { type: "finish" };

export type StepStatus = "done" | "active" | "pending";

export const DEFAULT_STEP_MS = 2600;

export function initialStage(count: number): StageState {
  return { step: Math.max(0, count - 1), playing: false, interacted: false };
}

export function stageReducer(count: number) {
  const last = Math.max(0, count - 1);
  const clamp = (step: number) => Math.min(last, Math.max(0, Math.trunc(step) || 0));

  return function reduce(state: StageState, action: StageAction): StageState {
    switch (action.type) {
      case "start":
        // The visitor got there first (a click before the stage was seen): their choice stays.
        if (state.interacted) return state;
        return { ...state, step: 0, playing: last > 0 };
      case "tick": {
        if (!state.playing) return state;
        const step = Math.min(last, state.step + 1);
        return { ...state, step, playing: step < last };
      }
      case "pick":
        return { step: clamp(action.step), playing: false, interacted: true };
      case "toggle":
        if (state.playing) return { ...state, playing: false, interacted: true };
        return { step: state.step >= last ? 0 : state.step, playing: last > 0, interacted: true };
      case "finish":
        return { ...state, step: last, playing: false };
    }
  };
}

// The stage advances only while it plays, is on screen and the tab is visible.
export function shouldTick({ playing, inView, pageVisible }: { playing: boolean; inView: boolean; pageVisible: boolean }) {
  return playing && inView && pageVisible;
}

export function stepStatus(index: number, current: number): StepStatus {
  if (index < current) return "done";
  return index === current ? "active" : "pending";
}

// Every step reached so far, as a space-separated list: the screen's CSS reads it with
// `[data-on~="3"]`, so each step adds its pieces on top of the previous ones.
export function reachedSteps(current: number): string {
  return Array.from({ length: Math.max(0, current) + 1 }, (_, index) => String(index)).join(" ");
}
