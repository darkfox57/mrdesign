# Admin dashboard

Conventions for the dashboard at `/admin`. It is Spanish only and lives outside `[locale]`.

## Roles

| Role | Can |
| --- | --- |
| `admin` | Everything, including users, API keys, messages and deleting images |
| `editor` | Content (read, write, publish) and images (read, upload, and the alt text of the images they uploaded) |

Permissions are defined in `src/lib/auth/permissions.ts`. A role missing from that file grants no access.

`requireSession()` reads the session and the user from the database on every request (no session cookie cache), so blocking a user, changing a role or revoking sessions counts on the next request.

## Mandatory rules

1. **Every dashboard page and server action calls `requireSession()` before reading or writing data.** The layout check is not enough: a page renders in parallel with its layout, and its data would leak in the redirect response.
2. **`requireSession()` is never wrapped in `try/catch`.** It redirects by throwing, and that exception must propagate.
3. **Server actions validate with zod `safeParse` and return per-field errors.** Never trust client data (ids, URLs, sizes) without checking it on the server.
4. **After a write, revalidate the public paths that changed** (`revalidatePath` or `updateTag`).
5. **Stored HTML goes through `sanitizePostHtml`** before it reaches the database.
6. **Login and password recovery only go through server actions.** The better-auth HTTP endpoints for sign-in, sign-up and reset stay closed in `src/app/api/auth/[...all]/route.ts`, because they would bypass the login rate limit.
7. **Integration and e2e tests run only against the local Docker database**, never a shared one.
8. **No `loading.tsx` in dashboard routes.** A loading boundary streams the page, so the status is sent before `requireSession()` redirects or `notFound()` runs: a forbidden or missing page would answer 200 instead of 307 or 404.

## Images

- `/admin/imagenes` is the R2 media library. Admins change the alt text of any image; editors only of the images they uploaded (`canEditMediaAlt` in `src/lib/media/rules.ts`). An image with no recorded uploader is admin-only.
- Deleting an image deletes the R2 object first and the row after, so a failed R2 call keeps the row and deleting again finishes the job. An image in use by a post or a landing cannot be deleted.

## Landings

Sales pages built with the Puck visual editor. Admins and editors create, edit and publish them.

- `/admin/landings` lists every landing with its public address, publishes or unpublishes it, and links to the translations it lacks. `/admin/landings/nueva` creates one; `?traducir=<id>&idioma=<locale>` creates its translation, which shares the `translationKey` and starts from a copy of its blocks.
- `/admin/landings/<id>/visual` is the full-screen editor (`(builder)` route group, no dashboard layout). "Guardar borrador" stores `draftBlocks` only; "Publicar" copies the page and its page fields (title, slug, SEO) to the landing and clears the draft; "Descartar borrador" goes back to what is published.
- Every save is validated on the server: strict block schemas, safe links, library images only, unique slug per language. Public reads validate the stored blocks again.
- The public page is `/soluciones/<slug>` (`/en/solutions/<slug>`), rendered on request. Writes revalidate the route pattern `/[locale]/soluciones/[slug]`.
- Blocks and how to add one: `.claude/skills/landing-blocks/SKILL.md`.

## UI

Dashboard components use the same tokens and Tailwind styles as the public site. There is no component library.
