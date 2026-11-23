# Feature: MR Design platform on Next.js

Objective: rebuild mrdesign as a Next.js platform to sell independent development services (sites, apps, plugins, WordPress, Shopify, PrestaShop), with an admin dashboard and landing builder replicating datilab-web.
Branch: `feat/nextjs-platform` · Delivery: ask-on-risk · Test runner: vitest (unit/integration) + Playwright (e2e).
Reference standard: `E:\Work\proyectos\datilab-web` (stack, conventions, `docs/admin.md` rules, ODD logbooks).

## Specs

- S1. "necesito montar toda la plataforma": complete platform, public site plus admin.
- S2. "migrar lo que tenemos a next js (ultima version estable,)": migrate the current static site (`index.html`, `html/page.html`, `sass/`, `assets/img/`) to Next.js latest stable (16.4.6 on 2026-11-23). The legacy static files are removed once their content and assets are migrated.
- S3. "vender aqui servicios que no tienen que ver con datilab, desarrollo de paginas, apps, desarrollo de plugins, sitios en wordpress, shopify, prestashop, etc.": the site sells development services (websites, apps, plugins, WordPress, Shopify, PrestaShop, etc.), with no DatiLab/DatiHub product content.
- S4. "hacer un dashboard como el de datilab": admin dashboard equivalent to datilab-web `/admin`: auth (better-auth, roles admin/editor), users, contact inbox, media library, blog, landings, API keys; following the mandatory rules in datilab-web `docs/admin.md`.
- S5. "replicar nuestro creador de landings": Puck-based visual landing builder (draft/publish, zod-validated blocks, public rendering), with generic blocks only (DatiHub-specific blocks are not ported).
- S6. "trabajar todo el sitio web": all public pages: home, services, portfolio, contact (with form), blog, legal pages, SEO (metadata, sitemap, robots, JSON-LD).
- S7. "setear los skills, el claude.md": project CLAUDE.md (plus AGENTS.md), `.atl/skill-registry.md` refreshed, and project skills encoding this repo's conventions.
- S8. "todo el proyecto configurarlo con nuestro estandar de desarrollo": same stack, tooling, tests, Docker/Easypanel deploy and ODD workflow as datilab-web; follow the global `ui-standards` skill.

### Assumptions (to confirm)

- A1. Keep the "Mr. Design" brand and existing logo; positioning changes from marketing agency to development services.
- A2. Portfolio keeps the current 6 projects as cases.
- A3. Contact data stays: Bogotá, contacto@mrdesign.agency, +57 (321) 960 8881.
- A4. Same infrastructure choices as datilab-web: Postgres (Docker local), Brevo email, Cloudflare R2 media, Easypanel deploy.
- A5. Locales: es (default, unprefixed) + en (`/en`), with next-intl `localePrefix: "as-needed"` (user decision, L3).

## Tasks

| ID | Specs | Task | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | S2, S8 | Scaffold Next 16.4.6 + TS + Tailwind 4 + ESLint + Vitest + Playwright + Prisma/Postgres Docker + env example | inline | pending | |
| T2 | S7, S8 | CLAUDE.md, AGENTS.md, docs (admin rules, deploy), project skills, skill registry | inline | pending | |
| T3 | S6, S8 | Design tokens, fonts, atoms/molecules, Logo, header/footer, i18n setup | inline | pending | |
| T4 | S2, S3, S6 | Public pages: home, services/[service], portfolio, contact form + action, legal, SEO; migrate assets; remove legacy static files | inline | pending | |
| T5 | S4 | Auth (better-auth), proxy guard, requireSession, login/recover/reset, dashboard shell, users | inline | pending | |
| T6 | S4 | Admin modules: inbox, media (R2), API keys | inline | pending | |
| T7 | S4, S6 | Blog: model, Tiptap editor, public blog routes | inline | pending | |
| T8 | S5 | Landing builder (Puck): model, blocks, editor, draft/publish, public route | inline | pending | |
| T9 | S8 | Dockerfile, standalone build, deploy doc, full e2e pass | inline | pending | |

## Log

- L1 (2026-11-23, user request verbatim): "necesito setear este proyecto completo, te explico que es, mrdesign es la plataforma porla que vendo servicios de desarrollo como independiente, lo que necesito es vender aqui servicios que no tienen que ver con datilab, desarrollo de paginas, apps, desarrollo de plugins, sitios en wordpress, shopify, prestashop, etc. necesito montar toda la plataforma, migrar lo que tenemos a next js (ultima version estable,) hacer un dashboard como el de datilab, replicar nuestro creador de landings y trabajar todo el sitio web, setear los skills, el claude.md, todo el proyecto configurarlo con nuestro estandar de desarrollo"
- L2 (2026-11-23): Mapped datilab-web as the reference: Next ^16.4.3, React 19, TS 6, Tailwind 4 (`@theme` tokens), Prisma 7 + pg adapter, better-auth 1.7, next-intl 4, Puck 0.24, Tiptap 3, zod 4, vitest 5, Playwright 1.64, npm, Node 24, Docker standalone. Architecture: App Router + atomic design components + `src/lib/<feature>`. There is no CLAUDE.md or project skills in datilab-web; the rules live in `docs/admin.md`. npm reports next latest = 16.4.6. Created branch `feat/nextjs-platform`. Next step: resolve A5 (locales), then T1.
