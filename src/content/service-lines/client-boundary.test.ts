import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The line copy is long (eight pages in two languages), and so is the founder guide. Both must stay on
// the server: a client module that reaches them, even through a value import of the service ids,
// ships all of it to the browser.

const SRC = path.resolve(__dirname, "../..");
const LINE_COPY = path.join(SRC, "content", "service-lines");
const FOUNDER_GUIDE = path.join(SRC, "content", "founder-guide.ts");
const isServerCopy = (file: string) => file.startsWith(LINE_COPY + path.sep) || file === FOUNDER_GUIDE;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "generated" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

function resolveImport(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? path.join(SRC, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(from), specifier)
      : null;
  if (!base) return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

// Value imports only: `import type` and `export type` are erased and never reach the bundle.
function valueImports(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const pattern = /^\s*(?:import|export)\s+(?!type\b)(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/gm;
  return [...source.matchAll(pattern)]
    .map((match) => resolveImport(file, match[1]))
    .filter((resolved): resolved is string => resolved !== null);
}

function reachesServerCopy(entry: string): string[] | null {
  const seen = new Set<string>();
  const walk = (file: string, trail: string[]): string[] | null => {
    if (isServerCopy(file)) return [...trail, file];
    if (seen.has(file)) return null;
    seen.add(file);
    for (const next of valueImports(file)) {
      const found = walk(next, [...trail, file]);
      if (found) return found;
    }
    return null;
  };
  return walk(entry, []);
}

const clientModules = sourceFiles(SRC).filter((file) => /^\s*["']use client["']/.test(readFileSync(file, "utf8")));

describe("server copy client boundary", () => {
  it("finds the client modules to check", () => {
    expect(clientModules.length).toBeGreaterThan(0);
  });

  it.each(clientModules.map((file) => [path.relative(SRC, file)]))("keeps the line copy and the founder guide out of %s", (relative) => {
    const trail = reachesServerCopy(path.join(SRC, relative));
    expect(trail?.map((file) => path.relative(SRC, file)) ?? null).toBeNull();
  });
});
