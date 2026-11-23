---
name: public-page
description: "Trigger: public page, new route, service page, portfolio, SEO, metadata, sitemap, translation, i18n. Build localized public pages with SEO and tests."
license: Apache-2.0
metadata:
  author: "mrdesign"
  version: "1.0"
---

## Activation Contract

Load before creating or changing routes under `src/app/[locale]/`, `src/content/`, `src/i18n/`, `messages/`, or SEO helpers.

## Hard Rules

- Load the global `ui-standards` skill too; this skill adds only project rules.
- Every page exists in es and en. Add localized pathnames in `src/i18n/routing.ts` and strings in both `messages/es.json` and `messages/en.json`.
- Use the navigation helpers from `src/i18n/navigation.ts`, never raw `next/link` for internal routes.
- Every page exports `generateMetadata` with title, description, canonical and hreflang alternates.
- Add indexable pages to `src/app/sitemap.ts`; add JSON-LD where a schema type fits (Service, Organization, BreadcrumbList, FAQPage).
- Typed site content lives in `src/content/`; editable content (blog, landings) lives in the database.
- Compose pages from existing atoms, molecules and organisms before creating new components.

## Decision Gates

| Content | Source |
| --- | --- |
| Short UI strings | `messages/*.json` |
| Structured, code-owned content (services, portfolio) | `src/content/*.ts`, typed, with es and en fields |
| Content editors change | Database (blog, landings) |

## Execution Steps

1. Write the failing e2e check first: status 200, h1, canonical and hreflang, in both locales.
2. Add the route, content and strings.
3. Add the sitemap entry and JSON-LD.
4. Run `npm test` (the messages parity test included), `npm run lint`, `npm run typecheck`, and the page's e2e spec.

## Output Contract

Report routes per locale, files touched, and observed test results.

## References

- `CLAUDE.md`
- `odd/tasks/nextjs-platform.md` (specs S3, S6)
