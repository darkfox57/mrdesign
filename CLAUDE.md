# MR Design platform

Public site and admin for MR Design, an independent development service (websites, apps, plugins, WordPress, Shopify, PrestaShop). The development standard mirrors `datilab-web`.

## Stack

Next.js 16 (App Router, `src/proxy.ts` instead of middleware), React 19, TypeScript, Tailwind 4 (tokens in `@theme` inside `src/app/globals.css`, no config file), Prisma 7 with `@prisma/adapter-pg` on PostgreSQL (client generated into `src/generated/prisma`), better-auth, next-intl (es default unprefixed, en under `/en`), Puck for the landing builder, Tiptap for the blog, zod for validation. npm and Node 24.

Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`: this version has breaking changes (see `AGENTS.md`).

## Commands

| Task | Command |
| --- | --- |
| Local database | `docker compose up -d` (Postgres on port 5434) |
| Dev server | `npm run dev` |
| Unit and integration tests | `npm test` |
| e2e (builds and serves on 3100) | `npm run test:e2e` |
| Lint and types | `npm run lint` and `npm run typecheck` |
| Migrations | `npm run db:migrate` (dev), `npm run db:deploy` (prod) |

## Architecture

```
src/app/[locale]/        public pages (localized pathnames in src/i18n/routing.ts)
src/app/admin/           dashboard, Spanish only, outside [locale]
  (dashboard)/           pages with the sidebar layout
  (builder)/             full-screen landing editor
src/app/api/             route handlers (auth, blog ingest)
src/components/          atoms, molecules, organisms, templates (atomic design)
src/content/             typed site content (services, portfolio, contact)
src/lib/<feature>/       domain logic, validation and data access per feature
src/i18n/                next-intl routing, request config, navigation
messages/{es,en}.json    UI strings
prisma/                  schema and migrations
e2e/                     Playwright specs
odd/tasks/               ODD feature logbooks
```

- Server actions live next to their route in `actions.ts`; they stay thin and call `src/lib/<feature>`.
- Components follow container/presentational: containers fetch and pass props; presentational components hold no data access.
- Colocate unit tests as `*.test.ts(x)`; tests that hit the database are `*.integration.test.ts`.

## Mandatory rules

1. Every admin page and server action follows `docs/admin.md` (session check first, zod validation, revalidation, sanitized HTML).
2. Integration and e2e tests run only against the local Docker database (`src/lib/is-local-database.ts`).
3. Never import DatiLab or DatiHub branding, content or product blocks.
4. Every UI string lives in `messages/es.json` and `messages/en.json`; both stay in sync (a test enforces it).
5. Secrets are server-only: never prefix them with `NEXT_PUBLIC_`. Document every new variable in `.env.example`.
6. Pin stable versions. Prisma's npm `latest` tag can point to a release candidate: install `prisma@7.x` explicitly. Keep ESLint on 9 while `eslint-config-next` plugins reject 10.

## Workflow

- Organic Driven Development: large work gets a logbook in `odd/tasks/<feature>.md`; the active one is `odd/tasks/nextjs-platform.md`.
- Test-first when a deterministic test exists: observe RED, then GREEN.
- Conventional commits, no AI attribution. Stage files by name, never `git add -A`.
- Run vitest from the `E:/Work/...` path. Under Git Bash, `/e/Work/...` finds no test files.
- Under Git Bash, prefix Playwright `-g "/route"` filters with `MSYS_NO_PATHCONV=1`, or the path is rewritten.
- Never write backslash escapes through a shell heredoc: they lose a backslash (a proxy matcher broke this way). Write such files with the editor tools, and build unicode escapes like `\u003c` from char codes, since tooling can collapse them.
- e2e always builds a fresh server (`reuseExistingServer: false`): on Windows a previous server can outlive the run and serve a stale build.

## Skills

Load the matching skill before the work:

| Work | Skill |
| --- | --- |
| Any UI: pages, components, styling | `ui-standards` (global) |
| React and Next.js code | `vercel-react-best-practices` (global) |
| Admin page or server action | `.claude/skills/admin-module/SKILL.md` |
| Landing builder block | `.claude/skills/landing-blocks/SKILL.md` |
| Public page, route, SEO or i18n | `.claude/skills/public-page/SKILL.md` |
| Splitting commits or PRs | `work-unit-commits`, `chained-pr` (global) |
