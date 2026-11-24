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
- A9. Public landing URL: es `/soluciones/[slug]`, en `/solutions/[slug]`, with a single landing kind (no DatiLab SECTOR/USE_CASE split). The legacy form editor and legacy JSON fields are not ported: landings are builder-only.
- A5. Locales: es (default, unprefixed) + en (`/en`), with next-intl `localePrefix: "as-needed"` (user decision, L3).

## Tasks

| ID | Specs | Task | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | S2, S8 | Scaffold Next 16.4.6 + TS + Tailwind 4 + ESLint + Vitest + Playwright + Prisma/Postgres Docker + env example | inline | done | 98bbfe8 |
| T2 | S7, S8 | CLAUDE.md, AGENTS.md, docs (admin rules), project skills, skill registry | inline | done | 6249156 |
| T3 | S6, S8 | Design tokens, fonts, atoms/molecules, Logo, header/footer, i18n setup | inline | done | 7599b42 |
| T4 | S2, S3, S6 | Public pages: home, services/[service], portfolio, contact form + action, legal, SEO; migrate assets; remove legacy static files | inline (writer delegation denied by permission classifier) | done | 9d5cd99 |
| T5 | S4 | Auth (better-auth), proxy guard, requireSession, login/recover/reset, dashboard shell, users | inline | done | e956888 |
| T6a | S4 | Admin inbox (mensajes): list, detail, read/unread, delete, reply by email; dashboard counts admin-only (review R1-004) | delegated (parallel unit, writer trigger a) | done | c0a25f9 |
| T6b | S4 | Admin media library on R2: presigned upload, sha256 dedupe, alt text, admin-only delete | delegated (parallel unit, writer trigger a) | done | 948b6a8 |
| T7.0 | S4, S6 | Blog foundation: Post/Category/Tag/Author/ApiKey models and migration, slugify, sanitizePostHtml, parsePostForm, coverPrefixes (R2 only), deps | inline | done | f1f516e |
| T7a | S4 | Admin blog: list, Tiptap editor, media picker, translations, publish; register post covers in media usage checks | delegated (parallel unit) | done | 51d243b |
| T7b | S6 | Public blog: index, post page, category page, SEO and JSON-LD, sitemap entries, e2e seed | delegated (parallel unit) | done | 83e5d4c |
| T7c | S4 | API keys admin and blog ingest API (/api/blog) | delegated (parallel unit) | done | 8d6ef99 |
| T11 | S4 | Inbox and media hardening from review L13 (alt text admin-only or owner, delete compensation and error mapping, clamp media page, error boundary `reset` prop, deterministic unread badge e2e, upload timeout, R2_ENDPOINT allowlist) | delegated (context backstop) | done | 17fbe0e |
| T12 | S4 | Blog and ingest follow-ups from verifier L16: ingest names the failing field for non-string values, transactional media delete vs post save race, validate postId/translationOf with zod, path-normalize cover prefix check; content actions check the `content:write` permission explicitly instead of session existence (R1); typed error mapping instead of message/meta substring checks (R2); report dropped or truncated terms; single source for revalidated blog paths; shared e2e helpers and per-spec slug prefixes | delegated (context backstop) | done, reduced scope (e2e helper refactor and media-delete race deferred) | (T12 commit) |
| T13 | S5 | Landing follow-ups from verifier L20: count nested blocks toward the 100-block limit (reference counts top level only), path-normalize image prefix (shared with T12), zod for translationOf and params.id, catch P2025 in setLandingPublication, explicit content:write permission (shared with T12 R1); optimistic concurrency (updatedAt check) for save and publish; handle rejected editor actions in VisualEditor; one hasDraft definition; per-spec landing rows instead of shared seeded rows and whole-table fingerprints; assert each hostile payload in landings-security; explicit message when the translate params are invalid | inline | pending | |
| T14 | S4 | Limiter design decision from verifier L25: A1 lock flooding (~2000 addresses evict a target's lock; choose: evict-expired-only + refuse new locks, or fail closed, or shared store) (A2 resolved by 0322c51); plus review L27 notes: row delete failing after the object delete, per-request session DB read cost, shared e2e helpers (createUser, client-address) | inline | pending (needs a design decision) | |
| T10 | S4 | Auth hardening from review L9 advisories (session cookie cache, limiter eviction and forwarded IP, 307 redirect on POST, silent reset failure) | delegated (context backstop) | done | 0111320 |
| T8.0 | S5 | Landing builder foundation: Landing model (blocks/draftBlocks, per-locale slug, translationKey) and migration, @puckeditor/core 0.24.2 | inline | done | d863737 |
| T8 | S5 | Landing builder: generic blocks with strict zod schemas, Puck editor (draft/publish/discard), admin list/create/translations, public route, e2e | delegated (context backstop: parent context is past ~150k) | done | 06435e2, 22f255d |
| T9 | S8 | Dockerfile (R2_PUBLIC_URL build arg), deploy doc, standalone smoke behind proxy headers, full e2e pass | inline | done | (T9 commit) |

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
- L8 (2026-11-23): T5 done.
  - Ported from datilab-web with `cp` (byte-exact), then rebranded:
    - `src/lib/auth/*`: better-auth 1.7.27, roles admin and editor, login rate limit, reset email.
    - `src/lib/admin/users.ts`, `src/app/admin/{layout,actions,password-actions,login,recuperar,restablecer}`.
    - `(dashboard)/{layout,page,usuarios}`, `api/auth/[...all]`, AdminSidebar, `scripts/create-admin.ts`.
    - Admin e2e specs (auth, users, password reset) and `e2e/global-setup.ts`.
  - The proxy adds the optimistic admin cookie check (matcher written with editor tools). Migration `auth` adds the user, session, account and verification tables. New script `npm run admin:create`.
  - The sidebar shows only Inicio and Usuarios; each module adds its entry when it ships. The dashboard home counts contact messages.
  - The auto-mode classifier denied writing a generated BETTER_AUTH_SECRET into the local `.env`. The user must set it, or `next start` fails with BetterAuthError. e2e injects its own test secret.
  - Evidence: vitest 53/53, typecheck and lint clean, e2e 79 passed and 23 skipped (admin flows run on desktop only, by design); `/admin` answers 307 to `/admin/login?next=%2Fadmin`.
  - Next: T6, the inbox, media (R2) and API keys.
- L9 (2026-11-23): Native review (RDD).
  - The whole-branch candidate (152 files, ~19.5k lines) stopped with `lens_context_budget_exceeded`: nothing was created. Scope was reduced to the T5 commit (base 9d5cd99, 43 files, 2543 lines), assessed high risk (auth migration, process spawn in e2e global-setup).
  - The user granted consent. Lenses: risk and reliability. Result: approved, acknowledged, authority burned (lineage review-fe42f92270753a86). T1-T4 were not reviewed.
  - 18 non-blocking advisory findings, follow-ups for later:
    - Sessions and roles: the 60s session cookie cache lets a banned or demoted user keep access for up to a minute (R1-001, R3-002). The dashboard home shows inbox counts to editors (R1-004).
    - Login rate limit: locked keys are never evicted (R1-002, R3-003). The per-IP limit trusts X-Forwarded-For when no proxy is in front (R1-003). The retry estimate uses the earlier unlock time (R3-004). The e2e specs share the per-IP limiter (R3-006).
    - Proxy and password reset: the 307 admin redirect replays POSTs (R3-001). Password reset requests swallow failures (R3-005).
- L10 (2026-11-23, user verbatim): "dejalo asi y sigue con t6, y si habilito la delegacion de subagentes". T1-T4 stay unreviewed. T6 is split into two parallel delegated units with disjoint edit surfaces:
  - T6a inbox: also fixes review R1-004.
  - T6b media: owns prisma/schema.prisma, playwright.config.ts, next.config.ts and .env.example.
  - The parent owns AdminSidebar.tsx and git, installed @aws-sdk/client-s3 and s3-request-presigner 3.1176, and runs the e2e seam check, because parallel writers cannot share port 3100 or the .next build dir.
  - API keys move to T7, because they only authorize the blog ingest API. Review advisories go to T10.
  - Process corrections adopted from now on: commits of about 400 lines, `gentle-ai review assess` after each commit, a Risk line per change, test-first in the UI too.
- L11 (2026-11-23): T6 done; both writers stayed inside their declared surfaces.
  - T6a: inbox at /admin/mensajes with list, detail, read and unread, delete, reply mailto, project type and site language. The dashboard home shows inbox counts only to admins (fixes R1-004).
  - T6b: R2 media library at /admin/imagenes. Alt text is now required on save, delete refuses when R2 is not configured, and `remote-pattern.ts` derives next/image hosts from R2_PUBLIC_URL. Migration `media_files`.
  - The parent seam check found three issues:
    1. The dashboard greeting duplicated the admin name, breaking a strict locator. The spec is now scoped to the banner.
    2. Both writers added `loading.tsx`, so the guard redirect and notFound answered 200 instead of 307 or 404. Removing them fixed it, and the rule is now in docs/admin.md (rule 8) and the admin-module skill.
    3. The project type label shared a text node with the locale. It is now wrapped in its own block.
  - Evidence: vitest 93/93 (integration tests against the local DB), lint and typecheck clean, e2e 93 passed with 0 failed (admin flows on desktop only). Screenshots at 360 (Pixel 7 at DPR 2.625 gives 945px images, no overflow) and 1280 for the dashboard, inbox and media pages.
  - T6b is 1167 authored lines, above the 400-line heuristic: it is one ported unit with code, tests and e2e together, so it was not split.
- L12 (2026-11-23): Independent verifier for T6 (item 2 escalated).
  - S4 PARTIAL with one blocker, B1: `mediaRemotePatterns` let wildcards from R2_PUBLIC_URL into the next/image allowlist.
  - Fixed: wildcards, a query or a hash now allow nothing. RED (1 failing) then GREEN; this recheck uses the verifier's exact repro.
  - Passed: guards, zod validation, presigned upload binding, no client secrets, reply header injection.
  - The verifier's replay probe is now the regression test `e2e/admin-actions.spec.ts`: editor and anonymous replays of the inbox and media actions change nothing, and the admin replay does.
  - Evidence: vitest 86 passed and 8 skipped (integration tests skip without DATABASE_URL), lint and typecheck clean, e2e 95 passed with 0 failed.
  - Open, needs a real bucket: whether R2 returns ChecksumSHA256 on HeadObject. Editors can edit alt text (consistent with media:upload). The verifier's scratch was removed.
- L13 (2026-11-23): Native review of T6.
  - Scope: base e956888 to 740046d, escalated item 2, consent granted. Lenses: risk, resilience and reliability.
  - Result: approved, acknowledged, authority burned (lineage review-e6b2ab6308f5b3ae).
  - Non-blocking warnings, now tracked as T11:
    - Media deletion: the row is deleted before the R2 object with no compensation or error mapping (R1, R4, R3-004). Deleting a missing image reports success (R3-007).
    - Uploads: registration depends on HeadObject returning ChecksumSHA256, so it must be verified on a real bucket (R4, R3-001). The browser PUT has no timeout. The undocumented R2_ENDPOINT override has no allowlist.
    - Access: updateAltText allows any role.
    - Inputs and error screens: the media page number is not clamped (R3-002). The error boundaries use a self-declared `retry` prop instead of the documented `reset` (R3-005).
    - Tests: the unread badge e2e is racy (R3-003).
  - The branch-wide RDD candidate still exceeds the reviewer budget (lens_context_budget_exceeded, third time), so reviews stay per slice from the last acknowledged boundary, which is now 740046d.
  - This log entry is uncommitted on purpose: it rides with the first T7 commit.
- L14 (2026-11-23, user): "sigue con t7".
  - T7 is split: the parent builds the shared foundation inline (T7.0), then three parallel writers take admin blog (T7a), public blog (T7b) and API keys plus ingest (T7c), each with disjoint surfaces. The parent owns AdminSidebar.tsx, git and the e2e seam check.
  - The models drop legacyId and the LEGACY source, since there is no legacy blog here.
  - Evidence: migration `blog_and_api_keys`; vitest for slugify, sanitize and post-form 21/21; typecheck clean.
- L15 (2026-11-23): T7 seam. All three writers stayed inside their surfaces. The parent added the Blog (all roles) and API keys (admin) sidebar entries and removed T7c's scratch files.
  - Evidence: vitest 159/159 against the local DB, lint and typecheck clean, e2e 151 passed with 0 failed (59 skipped: admin flows run on desktop only). Screenshots checked: blog index at 1280, published post at 360 (prose, list, CTA, related posts; the unsafe attribute is neutralized), new post editor at 1280.
  - Writer decisions accepted:
    - Revalidation uses the rewritten paths `/es/blog` and `/en/blog` as a layout, following the Next docs on revalidatePath with rewrites.
    - A cross-locale post slug answers 307 (slugs are editable). A duplicate slug on ingest answers 400.
    - Ingest matches existing tags and categories by slug or name.
    - The integration test stubs `@/i18n/navigation`, which vitest cannot load; the stub was checked against next-intl 4.16.
  - Notes:
    - The Next 16.3 docs in node_modules document `retry` as the stable error-boundary prop, so the T11 item about `reset` must be checked before changing anything.
    - Category pages are force-dynamic, so they need no revalidation from ingest.
    - The earlier warning about a French translation spec was stale; the spec has no fr references.
  - The whole-branch RDD START returned `invalid_request` because untracked files were not declared. It was not pursued: the branch exceeds the reviewer budget anyway, and reviews run per slice.
- L16 (2026-11-23): Independent verifier for T7 (items 2 and 3). S4 and S6 PASS, no blockers.
  - Probes: 39 XSS payloads against sanitizePostHtml and parsePostForm, all neutralized and idempotent. `/api/blog` answers 401 for missing, malformed, unknown or revoked keys before reading the body, 413 also without Content-Length, 400 cases, and a 201 response with exactly id, locale, slug, status and url. A draft key never publishes. JSON-LD carries no "<". `%2F%2Fevil` gives 404 with no Location. Archived and future posts are hidden everywhere. Editor and anonymous replays of the API key actions change nothing. The media guard blocks images used by posts.
  - The verifier's probe spec is now the regression test `e2e/blog-security.spec.ts`, 8/8 in the repo.
  - Fixed now:
    - `docs/api-blog.md` overstated the sanitizer: relative URLs are kept on purpose.
    - A stale comment in `post-form.ts` still referred to the legacy import.
  - Remaining notes go to T12. The verifier's scratch directories were removed.
- L17 (2026-11-23): Native review of T7.
  - The full slice (base 740046d, 5511 lines) failed preflight with lens_context_budget_exceeded (not_started, retry_safe), which was confirmed by capturing the code.
  - The user chose "Desde 83e5d4c" and granted consent. Scope: 83e5d4c..e821a13 (API keys, ingest, admin blog, security e2e; 34 files, 2899 lines). Lenses: risk, readability, reliability.
  - Result: approved, acknowledged, authority burned (lineage review-4ea8689b99b52b3b). There are 13 warnings and 9 suggestions, all non-blocking, now folded into T12. The notable one is R1: the content actions authorize on any valid session. That is correct today, because only admin and editor exist and both hold content:write, but it is fragile if a role is added.
  - Coverage: f1f516e (foundation) and 83e5d4c (public blog) have no native review; they are covered by the independent verifier (L16) and the security e2e. The reviewed boundary is now e821a13.
- L18 (2026-11-23, user): "sigue con t8".
  - The parent built the foundation (Landing model, migration `landings`, Puck 0.24.2; typecheck clean). The rest of T8 is one bounded writer: the builder lib, admin editor and public route are one dependent unit, and parent context is past the backstop.
- L19 (2026-11-24): T8 writer done, inside its surface.
  - Blocks (generic only): Hero, Cards, Faq, Columns (left and right slots for TextImage and Button), TextImage, Button, Cta. Each has strict zod schemas and named variants (background, columns, ratio, image side, button kind and alignment).
  - Builder-only per A9. Public route /soluciones/[slug] (/en/solutions/[slug]), force-dynamic, with FAQPage and BreadcrumbList JSON-LD. Writes revalidate the route pattern `/[locale]/soluciones/[slug]` (page). A landing whose stored blocks are invalid is logged and answers 404. The media guard covers blocks and draftBlocks.
  - Writer evidence: RED then GREEN for validate (18 failing then 37/37), landing-create (11), read-time validation (6) and media usage (1). vitest 227, lint and typecheck clean, e2e 186 passed with 0 failed (82 skipped, admin flows desktop only).
  - Parent spot check: vitest 227/227, lint 0, typecheck 0. All changes inside the declared surface.
  - A suspected mid-page header in the writer's screenshot was a scrolled full-page capture: a fresh capture shows the header at top 0 on both viewports.
  - Removed the uppercase tracked eyebrow from the Hero (a generic design tell in the design plan).
  - Commits: builder, blocks and public route first, then the admin editor.
- L20 (2026-11-24): Independent verifier for T8 (items 2 and 3). S4, S5 and S6 PASS, no blockers.
  - Probed about 60 hostile payloads: unknown and DatiHub block types, prototype keys, extra props, javascript/data/vbscript and protocol-relative links, backslash tricks, non-R2 images, depth and count limits, slot misuse.
  - Also checked: XSS and JSON-LD escaping; invalid stored blocks answer 404; draft, future-dated and cross-locale handling; hreflang; sitemap. Anonymous, forged-cookie and `/admin/login` replays change nothing.
  - The verifier's probe spec is now `e2e/landings-security.spec.ts`, 6/6 in the repo; lint and typecheck clean. The verifier's scratch was removed.
  - Notes go to T13. The block limit counting top-level blocks only matches datilab-web.
- L21 (2026-11-24): Native review of T8.
  - The slice from d863737 (3626 lines) failed preflight with lens_context_budget_exceeded (not_started), so the budget sits between 2900 and 3600 lines.
  - Reduced to 06435e2..f130af0 (admin editor and security e2e, 19 files, 1590 lines), consent granted, lenses risk and reliability.
  - A capture slot was skipped by my shell loop. The bound STATUS re-offered it and it was run once.
  - Result: approved, acknowledged, authority burned (lineage review-51e767d1a2d4be9c). 11 warnings and 6 suggestions, non-blocking, now in T13 (the main one: publish has no lost-update protection).
  - Coverage: d863737 and 06435e2 (model, blocks, validation, public route) have no native review; the independent verifier covered them (L20). The reviewed boundary is now f130af0.
- L22 (2026-11-24, user): "sigue con t9 cuando termine t8". T9 done.
  - Dockerfile gains the `R2_PUBLIC_URL` build argument: next.config derives the image allowlist at build time.
  - New `docs/deploy-easypanel.md` (English): service settings, build arguments, runtime variables, bucket CORS, migrations, first admin, local build, an antivirus TLS note, and what was verified. CLAUDE.md links it.
  - `docker build` locally fails at `apk add` with "TLS: server certificate not trusted": this machine's antivirus intercepts HTTPS, the same issue datilab-web documents. It is not a Dockerfile defect, and the parent did not change the user's antivirus settings.
  - Verified instead: the standalone server assembled like the image and run with `node server.js` and HOSTNAME=0.0.0.0 behind Easypanel-style proxy headers.
    - Status codes: /, /en, services, portfolio, contact, blog and the sitemap answer 200; /es gives 307 to /; an unknown landing gives 404; /admin gives 307 to the login; POST /api/blog without a key gives 401.
    - Headers: Location headers are relative, the canonical uses the public domain, and HSTS, X-Frame-Options and Permissions-Policy are sent.
  - `npm run build` exits 0. BetterAuthError "default secret" lines are logged harmlessly during page data collection (documented).
  - Final full check: vitest 227/227, lint 0, typecheck 0, e2e 192 passed with 0 failed (88 skipped: admin flows run on desktop only).
  - Still needed on the user side: a real Docker build in Easypanel, BETTER_AUTH_SECRET, the R2 and Brevo keys, and testing HeadObject ChecksumSHA256 on a real bucket.
- L23 (2026-11-24, user): "haz push a la rama principal".
  - main was fast-forwarded to feat/nextjs-platform and pushed (0dad61b..c727c37, no force; origin/main had not moved; no tracked secrets).
  - User queue: "sigue con t10", then "sigue con t11 cuando termine t10" and "sigue con t12 cuando termine t11". The work runs serially on branch feat/hardening.
- L24 (2026-11-24): T10 done (one delegated writer, context backstop).
  - Fixed:
    - R1-001 and R3-002: fresh session reads through `disableCookieCache`, confirmed in better-auth 1.7.27, and the cookie cache is disabled.
    - R1-002 and R3-003: separate bounded maps for counters and locks.
    - R3-004: the retry estimate uses the latest unlock.
    - R3-001: 303 for a cookie-less non-GET admin request.
    - R3-005: the reset request has a generic "unavailable" state on infrastructure errors and stays anti-enumeration.
    - R1-003: documented that the app must stay behind the proxy.
    - R3-006: failing-login specs use their own X-Forwarded-For. The parent fixed the last shared one in admin-users.spec.
    - R3-007, R3-009, R3-010: test additions.
  - Skipped: R1-004 (fixed in T6), R3-008 (no longer holds), R1-005 and R1-007 (not actionable here), R3-011 and R1-006 (global-setup and playwright config, deferred).
  - Evidence:
    - Writer RED then GREEN: limiter 13, proxy 3, reset action and form, fresh ban and demotion e2e.
    - Parent spot check: vitest 236/236, lint 0, typecheck 0, matcher intact, e2e 194 passed with 0 failed.
- L25 (2026-11-24): Independent verifier for T10: S4 PASS, no blockers.
  - Measured:
    - A banned user written straight to the DB is rejected on the next request.
    - The limiter stays bounded under 200k email and 300k IP sprays.
    - The retry estimate is exact in 845 of 845 histories.
    - Non-GET requests get 303. `next` resists open redirects (`safeNext` only accepts /admin paths).
    - The reset answers are identical in the normal path.
  - Advisories, now T14:
    - A1: about 2000 addresses can flood the lock map and evict a target's lock, diluting brute-force protection to 5 tries per ~40k requests.
    - A2: under partial write faults, the reset flow reveals which accounts exist.
  - The verifier's probe spec is now `e2e/auth-hardening.spec.ts` (6/6). Its scratch was removed.
  - Native review of T10 (lineage review-d79949bf227348fd, the hook's candidate c727c37..0111320, consent granted, four lenses):
    - risk and readability were captured.
    - resilience and reliability failed three times with "safeguards flagged this message". That is a model-safety rejection in the reviewer transport, deterministic for this content, not a code or Gentle AI defect.
    - Left open, not retried further. T10 is covered by the independent verifier and the e2e suite.
- L26 (2026-11-24): T11 done (one delegated writer).
  - Fixes:
    - Delete is now object-first, then row: an R2 failure keeps the row and maps to a typed error with a Spanish message. Deleting a missing id answers "La imagen ya no existe".
    - Alt text: admins edit any image; editors only images they uploaded (`uploadedById` already existed, so no migration). The rule is enforced inside the update.
    - `R2_ENDPOINT` override accepted only for localhost (NODE_ENV cannot gate it, because e2e runs next start). The fake R2 binds to 127.0.0.1.
    - Error boundaries use the framework `ErrorInfo` type. The `retry` prop is confirmed stable by the Next 16.3 docs, so finding R4/R3-005 had a wrong premise. The inbox boundary now logs.
    - Media page is clamped. The upload has a 120s timeout. The unread badge e2e is deterministic.
  - Skipped:
    - R1-usage-checks-empty: already resolved by T7 and T8.
    - The HeadObject checksum note: already documented.
    - R3-008: outside the writer's surface.
  - Evidence:
    - Writer RED: 10 failing tests, then GREEN.
    - Parent spot check: vitest 246/246, lint 0, typecheck 0, e2e 200 passed with 0 failed. The writer's one worker crash in blog-security did not reproduce.
- L27 (2026-11-24): T11 verified and T10+T11 natively reviewed.
  - Independent verifier for T11: S4, S5 and S8 PASS, no blockers.
    - About 40 R2_ENDPOINT tricks all fall back to the Cloudflare host.
    - Editor alt-text replays on others' images change nothing.
    - Delete survives an R2 outage and concurrent requests.
    - Its probe is now the regression test `e2e/admin-alt-text.spec.ts`. playwright.config's R2_ENDPOINT is aligned to 127.0.0.1.
  - Native review, hook candidate c727c37..17fbe0e (T10+T11, 38 files, 992 lines), consent granted, all four lenses captured. Result: correction_required on CRITICAL R1-reset-enumeration-oracle.
    - The T10 "unavailable" reset state appears only for failures that happen for existing accounts (token write, email send), so it enumerated admin accounts.
    - Correction plan: 60 lines.
    - Fix 0322c51 (45 lines): uniform `{ sent: true }` with a server log. RED, then GREEN. The form-only test was removed. This reverses T10's R3-005 fix, because anti-enumeration takes precedence, and resolves T14 A2.
    - The STATUS then asked for an untracked selection; the uncommitted spec was parked temporarily instead of inventing the schema.
    - Recovery to successor lineage review-46d4ea1c042764d1 (scope_changed). All four lenses passed: approved, acknowledged, authority burned.
    - The remaining warnings are folded into T14.
  - The reviewed boundary is now 0322c51.
- L28 (2026-11-24, user): asked "que tan grande es t12" and then "detenla". The writer was stopped before writing anything (tree clean).
  - User: "sube cambios". Pushed feat/hardening.
  - User: "sube directo a main". main fast-forwarded and pushed (c727c37..021f376).
  - User: "continua". T12 resumed with reduced scope: the e2e helper refactor was excluded because the user stopped T12 after hearing its size, and it was the optional part.
- L29 (2026-11-24): T12 done (26 files, +429/-106).
  - Fixed:
    - R1: `requirePermission` (content:read, write or publish) on every blog and landing page and action, which also covers T13's item.
    - Ingest names wrong-typed fields.
    - Typed cover error.
    - `violatesUnique`: Prisma 7 with adapter-pg sends no meta.target, only `driverAdapterError.cause.constraint`, so the old substring probe likely never matched. Now used in savePost, ingest and createLanding.
    - Tag and category clash answers 400.
    - Terms: 400 naming the field (no silent drop or truncation), with named caps.
    - zod ids for postId and translationOf.
    - `isLibraryUrl`: origin plus normalized path, rejecting userinfo and %2F/%5C. Shared by covers and landing images.
    - Single source for the revalidated blog paths.
  - Deferred: e2e helper refactor, media-delete race (T14), and items outside the writer's surface (ingest throttling, revoke no-op, e2e base URLs and dialogs).
  - Parent fixed a docs table broken by a paragraph inserted mid-table in docs/api-blog.md.
  - Evidence: writer RED 24 tests and 2 suites, then GREEN. Parent spot check: vitest 276/276, lint 0, typecheck 0, e2e 201 passed with 0 failed.
  - Contract change, item 3: ingest now answers 400 where it used to drop silently or return a generic error. Documented in docs/api-blog.md.
