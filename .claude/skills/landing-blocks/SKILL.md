---
name: landing-blocks
description: "Trigger: landing builder, Puck block, new landing section, visual editor, block schema. Add or change landing builder blocks with strict validation."
license: Apache-2.0
metadata:
  author: "mrdesign"
  version: "1.0"
---

## Activation Contract

Load before touching `src/lib/visual-builder/`, the editor under `src/app/admin/(builder)/landings/`, or landing rendering.

## Hard Rules

- Every block has three parts kept in sync: the Puck config entry (`config.tsx`), a strict zod schema in the `BLOCKS` registry (`validate.ts`), and a presentational render component.
- Blocks expose content and a few named variants only; never free styling (colors, sizes, raw classes).
- Links go through `safeLink` (relative, anchors, https, mailto only). Images go through the allowed-host list.
- All saved data passes `validateBuilderData` before storage and again on read.
- Editing writes `draftBlocks`; only publishing copies it to `blocks` and revalidates the public route.
- Block labels shown to visitors come from `messages/*.json`; editor labels stay Spanish.
- Never port DatiHub-specific blocks (Conversation, Modules, CaseStudy of DatiHub).

## Decision Gates

| Need | Action |
| --- | --- |
| New content shape | New block (config + schema + component + tests) |
| Visual alternative of an existing block | Add an enum `variant` to its schema |
| Nested layout | Use slots; respect the 3-level and 100-block limits |

## Execution Steps

1. Write a failing test in `validate.test.ts` for the new schema (valid data, rejected unsafe link, rejected unknown field).
2. Add the schema to `BLOCKS`, the config entry, and the render component under `src/components/`.
3. Render it in a builder e2e spec (`e2e/landings-builder.spec.ts`) on both viewports.
4. Run `npm test`, `npm run typecheck`, and the builder e2e spec.

## Output Contract

Report the block name, its fields and variants, files touched, and observed test results.

## References

- `CLAUDE.md`
- `odd/tasks/nextjs-platform.md` (spec S5)
