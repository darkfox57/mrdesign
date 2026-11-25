# Feature: the site builds itself

Objective: redesign the public site around the approved concept (the site assembles in front of the visitor), with one rankable page per line of work, success cases managed from the admin panel, advanced motion, careful messaging, and SEO plus AI readability.
Branch: `feat/site-build-experience` (from `main` at 12b8ed2) · Delivery: ask-on-risk · Test runner: vitest (unit/integration, local Docker DB only) + Playwright (e2e).
Concept prototype: https://claude.ai/artifact/Qr3txUKigWzghPKHV6B5sw (`Main.dc.html`, `Servicio-Shopify.dc.html`).

## Specs

- S1. "quiero que separemos los servicios en paginas que podamos posicionar, es decir las lineas de trabajo": one page per line of work, each with its own content, FAQ and structured data. Lines (user decision, L6 "Eight lines"): Sitios web a la medida, Landing pages y embudos, Tiendas Shopify, Tiendas PrestaShop, WordPress, Aplicaciones web y móviles, Evolución de plataformas, Plugins e integraciones.
- S2. "los casos de exito necesitamos poder cargarlos desde el panel": an admin module for success cases (es/en), each case with its own public page, linked to its lines of work, published only with client authorization. The current `src/content/portfolio.ts` projects are imported as drafts.
- S3. "necesito animaciones super avanzadas" and "pensaba en animaciones que muestren como se construye un sitio, me refiero a el framework o esqueleto, como se van armando las diferentes partes como el carrito, formularios, contenidos, fichas de productos": build stages where the site assembles (skeleton, layout, content, cart, forms, product cards), a site-wide X-ray mode, and working pieces that can show their skeleton. Motion respects `prefers-reduced-motion`.
- S4. "tiene que generar muchisimo impacto navegar y mostrar lo que somos capaces de construir" and "hay que salirnos del molde de un sitio web tradicional": follow the approved prototype, not a traditional template.
- S5. "cuidar mucho los mensajes": first person singular, neutral Spanish with `tú`, no invented data (pending facts stay hidden or as placeholders), no price-based positioning ("no voy a competir por precios").
- S6. "cuidar mucho el seo y la capacidad de la ia de leer el sitio web para posicionar en inteligencia artificial tambien": every text is server-rendered and readable without JavaScript; structured data per page type; `llms.txt`; answer-first summaries and FAQs.
- S7. "no quiero que dejemos a un lado lo de te suena alguno de estos problemas, creo que es un punto muy fuerte donde el usuario se puede ver identificado": keep the problems section on the home page.
- S8. "no debemos enfocarnos solo en los que ya tienen algo creado, no quiero que nos cerremos a personas que busquen empezar su negocio": the problems section offers two paths ("Estoy empezando" by default, "Ya tengo un negocio funcionando"), the CTA offers "Estoy empezando mi negocio", and a guide page `/empezar-mi-negocio-en-linea` targets founders.

## Tasks

| ID | Specs | Task | Route | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | S2 | `Case` model and migration, `/admin/casos` module, import of portfolio projects as drafts | delegated (context backstop) | done (64015a6, review approved) | Verifier: 2 findings confirmed and fixed test-first (5 RED, then GREEN). Parent: vitest 486/486, lint 0, typecheck 0. Writer: e2e cases, landing editor and builder 11/11. |
| T2 | S2, S6 | Public case pages `/portafolio/[slug]` (`/en/portfolio/[slug]`, see L10), CreativeWork JSON-LD, sitemap, `/portafolio` lists published cases | delegated (context backstop) | done | Writer: vitest 510, lint 0, typecheck 0, e2e cases+admin 19/19, public specs 133/133 + security 15/15. Verifier: 1 finding, fixed (L11). Parent: vitest 512/512. |
| T3 | S3, S4, S6 | Build-stage motion system: reusable stage, X-ray mode, GSAP scroll reveals, no-JS content | inline | pending | |
| T4 | S3, S4, S5, S7, S8 | New home page from the prototype | inline | pending | |
| T5 | S1, S3, S5, S6 | Eight line-of-work pages, each with its own build stage, summary, deliverables, comparison, FAQ, cases, related lines; Service, FAQPage, BreadcrumbList JSON-LD | inline or parallel writers | pending | |
| T6 | S6, S8 | Founder guide page `/empezar-mi-negocio-en-linea` | inline | pending | |
| T7 | S6 | `llms.txt`, Organization/ProfessionalService JSON-LD, metadata, no-JS e2e | inline | pending | |

Route notes: T1 Risk names item 1 (new migration), so its commit gets an independent verifier. Writers are delegated only when units can run in parallel (likely T5 lines).

## Log

- L1 (2026-11-24, user, verbatim): "es un buenb inicio, pero no cumple con lo que quiero proyectar del todo, quiero tener un sitio super espectacular, quiero que separemos los servicios en paginas que podamos posicionar, es decir las lineas de trabajo, los casos de exito necesitamos poder cargarlos desde el panel, necesito animaciones super avanzadas, cuidar mucho los mensajes y cuidar mucho el seo y la capacidad de la ia de leer el sitio web para posicionar en inteligencia artificial tambien, pensaba en animaciones que muestren como se construye un sitio, me refiero a el framework o esqueleto, como se van armando las diferentes partes como el carrito, formularios, contenidos, fichas de productos, tiene que generar muchisimo impacto navegar y mostrar lo que somos capaces de construir"
- L2 (2026-11-24, user, verbatim): "hay que salirnos del molde de un sitio web tradicional". The user chose "Prototype first"; the concept prototype was published as a Design canvas.
- L3 (2026-11-24, user, verbatim): "me guata la direccion, pero no quiero que dejemos a un lado lo de te suena alguno de estos problemas, creo que es un punto muy fuerte donde el usuario se puede ver identificado". The problems section was added after the hero, as broken flows that fix themselves.
- L4 (2026-11-24, user, verbatim): "si, pero igual no debemos enfocarnos solo en los que ya tienen algo creado, no quiero que nos cerremos a personas que busquen empezar su negocio, como lo plantearias?". The two-path proposal was approved ("si") and added to the prototype.
- L5 (2026-11-24, user, verbatim): "lo unico que no me cuadra es lo de tengo poco presupuesto, no voy a competir por precios". Founder problem 3 became "Quiero algo que crezca conmigo, no rehacerlo en un año".
- L6 (2026-11-24, user): the plan was approved ("si"). Choice for funnels and platform evolution: "Eight lines (Recommended)". Defaults stated and not objected to: full es/en parity per delivery, and T1 and T2 first.
- L7 (2026-11-24): T1 was delegated to one writer, because the parent context was near its backstop and the blog module is the template. The writer's report:
  - Migration `20261125035741_cases` is additive: a new `Case` table only.
  - Permissions are the same as the blog: `content` read, write and publish.
  - The server enforces the publish rules, including `clientAuthorized`.
  - Cover and gallery images are locked with `withLibraryImages`, and `caseUsage` blocks deleting an image a case uses.
  - The import maps `web` to `websites` and leaves `ecommerce` unmapped, because the platform is unknown. It is idempotent: the local DB has 12 draft cases.
  - Risk: item 1 (migration), and item 3 is touched because media usage, the blog's `PublishButton`/`TranslationsPanel` and the sidebar are shared code.
  - Next: an independent verification workflow with four lenses, each followed by a refuter.
- L8 (2026-11-24): verification of T1 (spec, security, data and regression lenses, each refuted). Confirmed and fixed in one correction batch:
  - (a) Case editor saves had no version check: a stale tab could overwrite newer edits and publish after authorization was revoked. Saves now write only while `updatedAt` matches, and `nextVersion` is now exported from the landing editor and reused.
  - (b) The import detected earlier imports by slug only, so a slug edit led to a duplicate. It now also matches `translationKey = portfolio-<id>`.
  Refuted: client authorization stays per language row, as documented (the user can change this).
  Spec and security lenses: no findings.
  Recheck: full vitest passed once and failed once. The failing run had 4 timeouts in `login-rate-limit.integration.test.ts` (5 s limit, under full-suite load). The same file alone passed 28/28, and the next full run passed 486/486.
  Follow-up: those rate-limit integration tests are timing-sensitive under parallel load.
- L9 (2026-11-25): T1 committed as 64015a6.
  - Native review: the user granted it, with lenses risk, resilience and reliability. It was approved and the acknowledgement burned lineage `review-dacb315bd6fafd41`. The reviewed boundary is now 64015a6.
  - Advisory follow-ups (non-blocking, later work):
    - **WARNING:** e2e/admin-cases.spec.ts leaks a user row.
    - **WARNING:** `listCases` filters are not covered by tests.
    - **WARNING:** the retry path after a conflict in casos/actions.ts:40.
    - **WARNING:** the import's target guard (import-portfolio.ts:47).
    - **WARNING:** media usage fan-out cost (library.ts:118).
    - **Suggestions:**
      - caseUsage substring match
      - prefill of authorization on a new translation
      - a vacuous redirect assertion in the e2e
      - import tests coupled to their run order
      - public case paths not asserted in revalidation
      - publication path when a media file is missing
      - publish errors short-circuit
      - import swallows unique errors
      - list filter parse
- L10 (2026-11-25, decision): case detail pages live under the portfolio index, at `/portafolio/[slug]` (`/en/portfolio/[slug]`), not `/casos/[slug]`. One hierarchy for breadcrumbs and SEO, and the existing `/portafolio` URL is kept. The index lists published cases and keeps the current project grid while none are published.
- L11 (2026-11-25): T2 delivered by a writer.
  - **Public visibility:** a case is public when it is PUBLISHED, `clientAuthorized` is true and `publishedAt` is not in the future.
  - **Language switcher:** a slug from the other language redirects to that case's translation, or to the index when there is none.
  - **Revalidation:** the index and every detail page refresh together, because `/portafolio` is revalidated as a layout.
  - **Line labels:** they live in messages, and a test pins their keys to `CASE_LINES`.
  - **Verification:** visibility, SEO and regression lenses, each refuted. The visibility and SEO lenses found nothing; a datePublished suggestion was refuted.
  - **Confirmed (minor):** `/portafolio` became `force-dynamic`, so a database outage would make it fail where it used to serve the static grid. Fixed inline, test-first: `casesOrEmpty` reports the error and falls back to the grid.
