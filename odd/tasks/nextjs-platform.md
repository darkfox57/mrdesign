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
- A6. The contact form adds a required "project type" select (the service ids plus "other") and stores the locale, so the inbox can triage leads.
- A7. The agency stats from the old site ("8 especialistas", "100+ proyectos") are dropped: they contradict the independent positioning, and no verified numbers exist. The copy is first person singular.
- A8. Service catalog (src/content/services.ts): custom websites, web and mobile apps, plugins and integrations, WordPress, Shopify, PrestaShop. The deliverables are a draft for the user to review. The legal texts follow Colombian Law 1581 of 2012 and still need the data controller's legal name.
- A5. Locales: es (default, unprefixed) + en (`/en`), with next-intl `localePrefix: "as-needed"` (user decision, L3).

## Tasks

| ID | Specs | Task | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | S2, S8 | Scaffold Next 16.4.6 + TS + Tailwind 4 + ESLint + Vitest + Playwright + Prisma/Postgres Docker + env example | inline | done | 98bbfe8 |
| T2 | S7, S8 | CLAUDE.md, AGENTS.md, docs (admin rules), project skills, skill registry | inline | done | 6249156 |
| T3 | S6, S8 | Design tokens, fonts, atoms/molecules, Logo, header/footer, i18n setup | inline | done | 7599b42 |
| T4 | S2, S3, S6 | Public pages: home, services/[service], portfolio, contact form + action, legal, SEO; migrate assets; remove legacy static files | inline (writer delegation denied by permission classifier) | done | (T4 commit) |
| T5 | S4 | Auth (better-auth), proxy guard, requireSession, login/recover/reset, dashboard shell, users | inline | pending | |
| T6 | S4 | Admin modules: inbox, media (R2), API keys | inline | pending | |
| T7 | S4, S6 | Blog: model, Tiptap editor, public blog routes | inline | pending | |
| T8 | S5 | Landing builder (Puck): model, blocks, editor, draft/publish, public route | inline | pending | |
| T9 | S8 | Dockerfile, standalone build, deploy doc, full e2e pass | inline | pending | |

## Log

- L1 (2026-11-23, user request verbatim): "necesito setear este proyecto completo, te explico que es, mrdesign es la plataforma porla que vendo servicios de desarrollo como independiente, lo que necesito es vender aqui servicios que no tienen que ver con datilab, desarrollo de paginas, apps, desarrollo de plugins, sitios en wordpress, shopify, prestashop, etc. necesito montar toda la plataforma, migrar lo que tenemos a next js (ultima version estable,) hacer un dashboard como el de datilab, replicar nuestro creador de landings y trabajar todo el sitio web, setear los skills, el claude.md, todo el proyecto configurarlo con nuestro estandar de desarrollo"
- L2 (2026-11-23): Mapped datilab-web as the reference: Next ^16.4.3, React 19, TS 6, Tailwind 4 (`@theme` tokens), Prisma 7 + pg adapter, better-auth 1.7, next-intl 4, Puck 0.24, Tiptap 3, zod 4, vitest 5, Playwright 1.64, npm, Node 24, Docker standalone. Architecture: App Router + atomic design components + `src/lib/<feature>`. There is no CLAUDE.md or project skills in datilab-web; the rules live in `docs/admin.md`. npm reports next latest = 16.4.6. Created branch `feat/nextjs-platform`. Next step: resolve A5 (locales), then T1.
- L3 (2026-11-23, user decision): locales "Español + inglés" → es default unprefixed, en under `/en`.
- L4 (2026-11-23): T1 done. Installed next 16.4.6, next-intl 4.16, Tailwind 4.3.5, vitest 5.1, Playwright 1.65 (downloaded chromium-headless-shell 1255). npm `latest` for prisma is 8.0.0-rc.35, so prisma is pinned to stable 7.10.1. ESLint 10 breaks the peer ranges of the eslint-config-next plugins, so ESLint stays on 9.39. `npm audit` reports 3 high findings in `effect`, which the prisma CLI uses for config parsing (dev tooling; same in datilab-web; the only fix offered downgrades to prisma 6), so they are accepted. Evidence: RED `is-local-database.test.ts` failed with the module missing; GREEN 2/2; lint clean; typecheck clean; e2e smoke 2/2 (mobile and desktop).
- L5 (2026-11-23): T2 done. Wrote CLAUDE.md, AGENTS.md (with the Next agent block), docs/admin.md, and the project skills admin-module, landing-blocks and public-page. `gentle-ai skill-registry refresh` indexed them as project scope (19 skills). `.atl/` stays gitignored as local tooling, as in datilab-web. Next: T3.
- L6 (2026-11-23): T3 done. Design plan from the ui-standards and frontend-design skills:
  - Signature as the memorable element: the logo PNG was cleaned into an alpha mask (`public/brand/logo-signature.png`) so the `signature` utility takes any color token.
  - Palette: brand magenta #E5105B (kept from the old site) and #C20E4E for text and buttons, ink #1E1A2E, paper #F6F4FA, graphite #4A4658, line #DCD7E6.
  - Type: Bricolage Grotesque (opsz and wdth axes) via next/font.
  - Measured contrast: graphite on paper 8.4:1, brand-600 on paper 5.5:1, white on brand-600 6.1:1.
  - Built: next-intl (es unprefixed, en /en, localized pathnames), proxy, messages parity test (RED: catalogs missing; GREEN 5/5), atoms Logo, ButtonLink, JsonLd; molecules LanguageSwitcher, MobileMenu; organisms SiteHeader, SiteFooter; localized 404.
  - Evidence: e2e smoke 8/8 (es and en, 404, no horizontal scroll, on mobile and desktop); screenshots inspected at 360 and 1280.
  - The logo source is a 200x145 raster; a vector logo from the user would sharpen large sizes.
- L7 (2026-11-23): T4 done.
  - Contact unit: ported from datilab-web (zod parser, honeypot, 5 per hour per IP rate limit, Brevo notification after the response) plus the project type field. Migration `contact_submissions` adds ContactSubmission with projectType and locale. Prisma 7 `migrate dev` does not regenerate the client; run `npx prisma generate`.
  - Pages: home (platform picker hero, services, why me, portfolio, numbered process, closing CTA), /servicios, /servicios/[service] (Service and BreadcrumbList JSON-LD, redirects slugs from the other language), /portafolio, both legal pages, sitemap.xml, robots.txt. The legacy static site was removed (it stays in git history).
  - Bugs found by tests:
    - A bash heredoc dropped backslashes: the proxy matcher `.*..*` excluded every route except / and /en, and JsonLd's escape collapsed to a no-op, which would allow script injection once user content reaches JSON-LD. Fixed with editor tools, and the escape is now built from char codes.
    - `backdrop-blur` on the sticky header collapsed the fixed mobile menu panel to 1px. The header is now solid. datilab-web has the same header and should be checked.
    - Stale Playwright servers outlived runs on Windows, so `reuseExistingServer` is now false. The gotchas are in CLAUDE.md.
  - Evidence:
    - RED: projectType (4 failing), JsonLd escape (1 failing), and the slug redirect plus language switcher e2e tests.
    - GREEN: vitest 27/27, lint clean, typecheck clean, e2e 56/56 (mobile and desktop).
    - Screenshots inspected: home at 1280 and 360, Shopify service at 1280, en contact at 360. Below-the-fold portfolio images are lazy and the optimizer answers 200.
  - Pending: the nav and footer "Blog" link returns 404 until T7. Next: T5.
