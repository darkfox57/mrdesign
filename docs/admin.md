# Admin dashboard

Conventions for the dashboard at `/admin`. It is Spanish only and lives outside `[locale]`.

## Roles

| Role | Can |
| --- | --- |
| `admin` | Everything, including users, API keys, messages and deleting images |
| `editor` | Content (read, write, publish) and images (read, upload, and the alt text of the images they uploaded) |

Permissions are defined in `src/lib/auth/permissions.ts`. A role missing from that file grants no access. Blog and landing pages and actions check the permission they need with `requirePermission("content", ["read" | "write" | "publish"])` (`src/lib/auth/require-permission.ts`), not just a session, so a role added later without content access is turned away.

`requireSession()` reads the session and the user from the database on every request (no session cookie cache), so blocking a user, changing a role or revoking sessions counts on the next request.

## Mandatory rules

1. **Every dashboard page and server action calls `requireSession()` before reading or writing data.** The layout check is not enough: a page renders in parallel with its layout, and its data would leak in the redirect response.
2. **`requireSession()` and `requirePermission()` are never wrapped in `try/catch`.** They redirect by throwing, and that exception must propagate.
3. **Server actions validate with zod `safeParse` and return per-field errors.** Never trust client data (ids, URLs, sizes) without checking it on the server.
4. **After a write, revalidate the public paths that changed** (`revalidatePath` or `updateTag`).
5. **Stored HTML goes through `sanitizePostHtml`** before it reaches the database.
6. **Login and password recovery only go through server actions.** The better-auth HTTP endpoints for sign-in, sign-up and reset stay closed in `src/app/api/auth/[...all]/route.ts`, because they would bypass the login rate limit.
7. **Integration and e2e tests run only against the local Docker database**, never a shared one.
8. **No `loading.tsx` in dashboard routes.** A loading boundary streams the page, so the status is sent before `requireSession()` redirects or `notFound()` runs: a forbidden or missing page would answer 200 instead of 307 or 404.

## Login and reset throttling

`src/lib/auth/login-rate-limit.ts` counts login attempts and password-reset requests per account and per client address, in the `AuthThrottle` table:

| Flow | Per account | Per address | Window |
| --- | --- | --- | --- |
| Login (`login:` keys) | 5 attempts | 20 attempts | 15 min |
| Reset request (`reset:` keys) | 3 requests | 10 requests | 15 min |

- **Attempts are counted before they are verified.** `consume` increments the account and the address in one statement, so both counts commit or neither does, and decides from the state after that increment. Up to the limit the attempt goes on; past it, it is refused before the password is checked or an email is sent. This way parallel requests cannot all slip through, and a locked account cannot be probed.
- **One threshold.** The attempt that uses the last slot (the 5th login, for example) is allowed and stores no lock. The first attempt past the limit is refused and stores `lockedUntil`, the end of the window. A key refuses exactly while its `lockedUntil` is in the future, so a stored lock and a refusal are the same thing.
- **A lock stands for its whole window.** Refunds (below) give back a counted slot, never a lock, and never take a counter below zero or touch any window but the one that counted the attempt.
- **A successful login clears the account** and gives the address back the attempt it counted, so under normal use logins do not count against an address. The address is not reset, because other accounts may be under attack from it, and a lock it already stored stands. One address therefore gets at most 20 failed guesses per window however many of its users log in: every allowed failure was counted at 20 or less, and a refund only ever removes a success. Clearing the account is retried once, so a correct password as the 5th attempt does not leave the account refusing its owner after one failed write.
- **A password check that fails for infrastructure reasons is given back** on both keys, and the form answers "No pudimos verificar el ingreso. Prueba de nuevo en unos minutos.". A credential rejection is any 4xx `APIError` from better-auth: wrong password, unknown email, account without a password (all `INVALID_EMAIL_OR_PASSWORD`), banned user (`BANNED_USER`) and request errors. Those keep their count. A banned user's attempt keeps it too: refunding a correct password would reveal it. Anything else (a database or adapter error, a better-auth 5xx) judged no password, so it is refunded.
- A reset request always counts: there is no success to refund.
- Every key counts in a fixed window that starts at its first attempt. Past the limit the key stays refused until that window ends, and the form shows how many minutes are left. Refused attempts are counted too, but they do not extend the window.
- Refused attempts cost a write, the price of counting first: each attempt, refused or not, is one upsert of two rows. A flood against one account or address writes to those two rows instead of reading them. The counters stay exact and the attacker gains no attempt.
- An attempt counts on both keys, so under parallel load a request refused by one key still uses a slot of the other. With both limits in play, fewer than the limit may get through; never more.
- The column is still called `failures` (renaming it needs a migration), but it holds attempts: every counted attempt until a refund gives one back.
- Locks are rows, so they survive restarts, hold across instances, and no number of other locked keys can push one out.
- A key is the namespace and kind in clear text, then the SHA-256 (hex) of the lower-cased email or the address, for example `login:acct:<sha256>`. Every key has the same short length however long the email or forwarded address is, and the prefix still finds a namespace. `throttleKey` derives it; tests and e2e cleanups use it rather than building keys by hand.
- Rows whose window and lock have both ended are deleted at most every 5 minutes per process, from `consume`. There is no cron. The cleanup skips rows a count is writing, so it never waits on one and cannot deadlock with it.
- If an attempt cannot be counted, the throttle fails closed. Login refuses the attempt with "No pudimos verificar el ingreso. Prueba de nuevo en unos minutos." and does not check the password. A reset request sends no email but still gets the uniform "sent" answer, so it cannot reveal which accounts exist. Both cases are logged.
- To unlock an account by hand, delete its row: `delete from "AuthThrottle" where key = 'login:acct:' || encode(sha256(convert_to(lower('<email>'), 'UTF8')), 'hex');`.

## Images

- `/admin/imagenes` is the R2 media library. Admins change the alt text of any image; editors only of the images they uploaded (`canEditMediaAlt` in `src/lib/media/rules.ts`). An image with no recorded uploader is admin-only.
- Deleting an image deletes the R2 object first and the row after, so a failed R2 call keeps the row and deleting again finishes the job. An image in use by a post or a landing cannot be deleted.

## Landings

Sales pages built with the Puck visual editor. Admins and editors create, edit and publish them.

- `/admin/landings` lists every landing with its public address, publishes or unpublishes it, and links to the translations it lacks. An archived landing is neither published nor unpublished from there. `/admin/landings/nueva` creates one; `?traducir=<id>&idioma=<locale>` creates its translation, which shares the `translationKey` and starts from a copy of its blocks. A translate link with a missing source (`?idioma=` without `traducir` included), a missing or unknown language, or the source's own language shows why instead of the form.
- `/admin/landings/<id>/visual` is the full-screen editor (`(builder)` route group, no dashboard layout). "Guardar borrador" stores `draftBlocks` only; "Publicar" copies the page and its page fields (title, slug, SEO) to the landing and clears the draft; "Descartar borrador" goes back to what is published. The list and the editor show a draft whenever one is stored (`hasLandingDraft`).
- Save, publish and discard carry the version (`updatedAt`) the editor loaded and only write while the landing still has it (`src/lib/landings/editor.ts`). If someone else saved meanwhile, nothing is overwritten and the editor shows "Alguien más guardó esta landing mientras la editabas. Recarga la página para ver la versión actual." A failed request (network or server error) shows an error and re-enables the buttons.
- Every save is validated on the server: strict block schemas, safe links, library images only, at most 100 blocks counting the ones inside slots, unique slug per language. Public reads validate the stored blocks again, and so does the editor before loading them: a stored page that fails starts the editor from the published page or an empty one, with a notice.
- The public page is `/soluciones/<slug>` (`/en/solutions/<slug>`), rendered on request. Writes revalidate the route pattern `/[locale]/soluciones/[slug]`.
- Blocks and how to add one: `.claude/skills/landing-blocks/SKILL.md`.

## UI

Dashboard components use the same tokens and Tailwind styles as the public site. There is no component library.
