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

- Every block has three parts kept in sync: the Puck config entry (`src/lib/visual-builder/config.tsx`), a strict zod schema in the `BLOCKS` registry (`src/lib/visual-builder/validate.ts`), and a presentational render component in `src/components/organisms/landing-blocks/`.
- Blocks expose content and a few named variants only (`styles.ts` maps them to tokens); never free styling (colors, sizes, raw classes).
- Links go through `safeLink` (relative, anchors, https, mailto only) and render through `localizeHref`. Images come only from the R2 library: the `ImageField` picker in the editor, `imageHostErrors` with `coverPrefixes()` on save, `next/image` (allowed by `mediaRemotePatterns`) on render.
- All saved data passes `validateBuilderData` before storage, again on public read (`src/lib/landings/landings.ts`) and before the editor loads it (`editorStartData`, which falls back to the published page or an empty one and shows a notice).
- Editing writes `draftBlocks`; only publishing copies it to `blocks` and revalidates `PUBLIC_LANDING_ROUTE` (`src/lib/landings/routes.ts`).
- Editor writes go through `src/lib/landings/editor.ts`: save, publish and discard carry the landing's `updatedAt` as a version and write only while the row still has it (a stale editor gets the conflict message, never an overwrite). Actions stay thin.
- Blocks allowed in slots (`COLUMN_BLOCKS`) style their nested look with `in-data-nested:` variants; Columns and the hero's side set `data-nested`.
- A block that stores an image URL must stay covered by the landing check in `usageChecks` (`src/lib/media/library.ts`).
- Visitor labels outside the blocks' content live in the `Landing` namespace of `messages/*.json`; editor labels stay Spanish in code.
- Never port DatiHub-specific blocks (Conversation, Modules, CaseStudy of DatiHub).

## Decision Gates

| Need | Action |
| --- | --- |
| New content shape | New block (config + schema + component + tests) |
| Visual alternative of an existing block | Add an enum `variant` to its schema |
| Nested layout | Use slots; respect the 3-level limit and the 100-block limit, which counts the blocks inside slots too |

## Execution Steps

1. Write a failing test in `validate.test.ts` for the new schema (valid data, rejected unsafe link, rejected unknown field).
2. Add the schema to `BLOCKS`, the config entry, and the render component under `src/components/organisms/landing-blocks/`.
3. Add it to the seeded landing in `scripts/seed-e2e-landings.ts` and assert it in `e2e/landings-builder.spec.ts` (both viewports).
4. Run `npm test`, `npm run typecheck`, and the builder e2e specs (`landings-builder`, `admin-visual-builder`).

## Output Contract

Report the block name, its fields and variants, files touched, and observed test results.

## References

- `CLAUDE.md`
- `odd/tasks/nextjs-platform.md` (spec S5)
