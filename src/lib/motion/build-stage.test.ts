import { describe, expect, it } from "vitest";
import { initialStage, reachedSteps, shouldTick, stageReducer, stepStatus } from "./build-stage";

const COUNT = 6;
const reduce = stageReducer(COUNT);

describe("initialStage", () => {
  it("starts on the finished build, so the server HTML and reduced motion show the complete result", () => {
    expect(initialStage(COUNT)).toEqual({ step: 5, playing: false, interacted: false });
  });

  it("works with a single step", () => {
    expect(initialStage(1)).toEqual({ step: 0, playing: false, interacted: false });
  });
});

describe("stageReducer", () => {
  it("start rewinds to the first step and plays", () => {
    expect(reduce(initialStage(COUNT), { type: "start" })).toEqual({ step: 0, playing: true, interacted: false });
  });

  it("start never overrides a step the visitor already picked", () => {
    const picked = { step: 2, playing: false, interacted: true };
    expect(reduce(picked, { type: "start" })).toBe(picked);
  });

  it("tick advances one step while playing", () => {
    expect(reduce({ step: 2, playing: true, interacted: false }, { type: "tick" })).toEqual({ step: 3, playing: true, interacted: false });
  });

  it("tick reaching the last step holds there and stops playing", () => {
    expect(reduce({ step: 4, playing: true, interacted: false }, { type: "tick" })).toEqual({ step: 5, playing: false, interacted: false });
  });

  it("tick does nothing while paused or already on the last step", () => {
    const paused = { step: 2, playing: false, interacted: true };
    expect(reduce(paused, { type: "tick" })).toBe(paused);
    const last = { step: 5, playing: true, interacted: false };
    expect(reduce(last, { type: "tick" })).toEqual({ step: 5, playing: false, interacted: false });
  });

  it("pick jumps to a step, pauses and counts as an interaction", () => {
    expect(reduce({ step: 1, playing: true, interacted: false }, { type: "pick", step: 4 })).toEqual({ step: 4, playing: false, interacted: true });
  });

  it("pick clamps an out-of-range step", () => {
    expect(reduce(initialStage(COUNT), { type: "pick", step: 99 }).step).toBe(5);
    expect(reduce(initialStage(COUNT), { type: "pick", step: -3 }).step).toBe(0);
  });

  it("toggle pauses a playing stage and resumes a paused one", () => {
    const paused = reduce({ step: 2, playing: true, interacted: false }, { type: "toggle" });
    expect(paused).toEqual({ step: 2, playing: false, interacted: true });
    expect(reduce(paused, { type: "toggle" })).toEqual({ step: 2, playing: true, interacted: true });
  });

  it("toggle on the last step replays from the start", () => {
    expect(reduce({ step: 5, playing: false, interacted: false }, { type: "toggle" })).toEqual({ step: 0, playing: true, interacted: true });
  });

  it("finish jumps to the last step and stops, for reduced motion", () => {
    expect(reduce({ step: 1, playing: true, interacted: false }, { type: "finish" })).toEqual({ step: 5, playing: false, interacted: false });
  });
});

describe("shouldTick", () => {
  it("ticks only while playing, on screen and with the tab visible", () => {
    expect(shouldTick({ playing: true, inView: true, pageVisible: true })).toBe(true);
    expect(shouldTick({ playing: false, inView: true, pageVisible: true })).toBe(false);
    expect(shouldTick({ playing: true, inView: false, pageVisible: true })).toBe(false);
    expect(shouldTick({ playing: true, inView: true, pageVisible: false })).toBe(false);
  });
});

describe("stepStatus and reachedSteps", () => {
  it("marks earlier steps done, the current one active and later ones pending", () => {
    expect([0, 1, 2, 3].map((index) => stepStatus(index, 2))).toEqual(["done", "done", "active", "pending"]);
  });

  it("lists every reached step for the screen's CSS", () => {
    expect(reachedSteps(0)).toBe("0");
    expect(reachedSteps(3)).toBe("0 1 2 3");
  });
});
