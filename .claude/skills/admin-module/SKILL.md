---
name: admin-module
description: "Trigger: admin dashboard, /admin page, server action, panel module, sidebar entry. Build dashboard features with the session, validation and test rules."
license: Apache-2.0
metadata:
  author: "mrdesign"
  version: "1.0"
---

## Activation Contract

Load before creating or changing anything under `src/app/admin/`, `src/lib/admin/`, `src/lib/auth/`, or a server action that writes data.

## Hard Rules

- Call `requireSession(roles?)` first in every page and server action, outside any `try/catch`.
- Validate every action input with zod `safeParse`; return `{ ok: false, errors }` per field, never throw validation errors to the client.
- Re-check ownership and existence of ids on the server; never trust client ids, URLs or sizes.
- Revalidate every public path a write changes.
- Sanitize stored HTML with `sanitizePostHtml`.
- Keep the UI Spanish, built with the site tokens; add no component library.
- Gate admin-only modules both in `AdminSidebar` and on the server with `requireSession(["admin"])`.

## Decision Gates

| Change | Where |
| --- | --- |
| Data access or business rule | `src/lib/admin/<module>.ts` with colocated tests |
| Form parsing | `src/lib/admin/<module>-form.ts` (zod schema + parse function) |
| Route and action | `src/app/admin/(dashboard)/<module>/page.tsx` and `actions.ts` |
| Full-screen editor | `src/app/admin/(builder)/` |
| New permission | `src/lib/auth/permissions.ts` |

## Execution Steps

1. Read `docs/admin.md` and an existing module of the same shape.
2. Write the failing test first: unit test for the form parser, integration test for data access (local DB only).
3. Implement lib, then action, then page; keep the action thin.
4. Add the sidebar entry with its role filter.
5. Add a Playwright spec `e2e/admin-<module>.spec.ts` covering the happy path and the forbidden role.
6. Run `npm test`, `npm run lint`, `npm run typecheck`, then the new e2e spec.

## Output Contract

Report files touched, the rule each guard satisfies, and the observed test commands with results.

## References

- `docs/admin.md`
- `CLAUDE.md`
