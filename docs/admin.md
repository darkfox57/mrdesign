# Admin dashboard

Conventions for the dashboard at `/admin`. It is Spanish only and lives outside `[locale]`.

## Roles

| Role | Can |
| --- | --- |
| `admin` | Everything, including users, API keys, messages and deleting images |
| `editor` | Content (read, write, publish) and images (read, upload) |

Permissions are defined in `src/lib/auth/permissions.ts`. A role missing from that file grants no access.

## Mandatory rules

1. **Every dashboard page and server action calls `requireSession()` before reading or writing data.** The layout check is not enough: a page renders in parallel with its layout, and its data would leak in the redirect response.
2. **`requireSession()` is never wrapped in `try/catch`.** It redirects by throwing, and that exception must propagate.
3. **Server actions validate with zod `safeParse` and return per-field errors.** Never trust client data (ids, URLs, sizes) without checking it on the server.
4. **After a write, revalidate the public paths that changed** (`revalidatePath` or `updateTag`).
5. **Stored HTML goes through `sanitizePostHtml`** before it reaches the database.
6. **Login and password recovery only go through server actions.** The better-auth HTTP endpoints for sign-in, sign-up and reset stay closed in `src/app/api/auth/[...all]/route.ts`, because they would bypass the login rate limit.
7. **Integration and e2e tests run only against the local Docker database**, never a shared one.
8. **No `loading.tsx` in dashboard routes.** A loading boundary streams the page, so the status is sent before `requireSession()` redirects or `notFound()` runs: a forbidden or missing page would answer 200 instead of 307 or 404.

## UI

Dashboard components use the same tokens and Tailwind styles as the public site. There is no component library.
