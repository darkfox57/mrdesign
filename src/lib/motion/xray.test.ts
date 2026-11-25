import { afterEach, describe, expect, it } from "vitest";
import { readXray, writeXray, XRAY_CLASS, XRAY_STORAGE_KEY, xrayBootScript } from "./xray";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data,
  };
}

const throwing = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("X-ray persistence", () => {
  it("reads off when nothing is stored, or without storage", () => {
    expect(readXray(memoryStorage())).toBe(false);
    expect(readXray(null)).toBe(false);
  });

  it("writes on and off, and reads them back", () => {
    const storage = memoryStorage();
    writeXray(storage, true);
    expect(storage.data.get(XRAY_STORAGE_KEY)).toBe("on");
    expect(readXray(storage)).toBe(true);
    writeXray(storage, false);
    expect(storage.data.has(XRAY_STORAGE_KEY)).toBe(false);
    expect(readXray(storage)).toBe(false);
  });

  it("ignores unknown stored values", () => {
    expect(readXray(memoryStorage({ [XRAY_STORAGE_KEY]: "yes" }))).toBe(false);
  });

  it("survives storage that throws (private mode, blocked site data)", () => {
    expect(readXray(throwing)).toBe(false);
    expect(() => writeXray(throwing, true)).not.toThrow();
  });
});

describe("xrayBootScript", () => {
  afterEach(() => {
    document.documentElement.classList.remove(XRAY_CLASS);
  });

  const run = (storage: unknown) => new Function("localStorage", "document", xrayBootScript)(storage, document);

  it("adds the class before paint when X-ray was left on", () => {
    run(memoryStorage({ [XRAY_STORAGE_KEY]: "on" }));
    expect(document.documentElement.classList.contains(XRAY_CLASS)).toBe(true);
  });

  it("leaves the page alone when X-ray is off or storage throws", () => {
    run(memoryStorage());
    run(throwing);
    expect(document.documentElement.classList.contains(XRAY_CLASS)).toBe(false);
  });
});
