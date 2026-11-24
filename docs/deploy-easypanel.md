# Deploying on Easypanel

The site ships as a Docker image built from the repository `Dockerfile`. Next.js produces a self-contained server (`output: "standalone"`) that runs with `node server.js`.

## Service settings

| Field | Value |
| --- | --- |
| Source | This GitHub repository, branch `main` |
| Build | Dockerfile (`./Dockerfile`) |
| Port | `3000` |

### Network: only behind the Easypanel proxy

The login and password-reset rate limits count failed attempts per account and per client address. The address is the **last** `X-Forwarded-For` entry (`src/lib/client-ip.ts`), which Easypanel's proxy appends to every request. That is only trustworthy while every request goes through the proxy:

- Publish the service through an Easypanel domain only. Do not map the container port (`3000`) to a host port, and do not open it in the firewall.
- If another proxy or CDN goes in front of Easypanel, make sure the last entry is still the one Easypanel adds. If a hop forwards the header unchanged, a client can pick its own address and the per-IP limit stops working.

The per-account limit does not use the address, so an account still locks after 5 failed attempts even if the address can be forged.

### Build arguments

| Argument | Example | Purpose |
| --- | --- | --- |
| `SITE_URL` | `https://mrdesign.agency` | Public URL used in metadata, canonical links and structured data. |
| `R2_PUBLIC_URL` | `https://media.mrdesign.agency` | Public URL of the media bucket. `next.config.ts` builds the image allowlist from it at build time, so it must be a build argument as well as a runtime variable. |

### Runtime environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Set it only in the service environment, never in the image. |
| `SITE_URL` | Same value as the build argument; pages rendered on request (blog, landings, sitemap) read it at runtime. |
| `BETTER_AUTH_SECRET` | Signs dashboard sessions. Generate it with `openssl rand -base64 32`, one per environment. |
| `BETTER_AUTH_URL` | Public site URL with `https://`. With `https://` the session cookie is `Secure`, and it is the base of password reset links. |
| `BREVO_API_KEY` | Sends contact notifications and password reset emails. Without it messages are still stored, but no email goes out (an admin can still set passwords from Usuarios). |
| `CONTACT_NOTIFY_EMAIL` | Optional. Who receives contact notifications (default `contacto@mrdesign.agency`). |
| `CONTACT_SENDER_EMAIL` | Optional. Verified Brevo sender (default `noreply@mrdesign.agency`). |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 bucket for the media library. The token needs *Object Read & Write* on that bucket only. Without them the site works and the library shows a "not configured" notice. |
| `R2_PUBLIC_URL` | Same value as the build argument. |

### Bucket CORS

The browser uploads straight to R2, so the bucket needs this policy (R2 → Settings → CORS Policy):

```json
[{
  "AllowedOrigins": ["https://mrdesign.agency", "http://localhost:3000"],
  "AllowedMethods": ["PUT"],
  "AllowedHeaders": ["content-type", "x-amz-checksum-sha256"],
  "MaxAgeSeconds": 3600
}]
```

Before the first launch, upload one image from the dashboard and confirm it registers. Registration requires R2 to return the object's SHA-256 checksum on `HeadObject`; the e2e suite uses a fake bucket, so this is the one step only a real bucket can prove.

## Database migrations

The image does not run migrations on start. Before deploying a change that adds migrations, apply them to the production database from a checkout of the repository:

```bash
DATABASE_URL="..." npm run db:deploy
```

## First administrator

There is no public sign-up. Create the first user with the script, passing the data through environment variables so the password stays out of the shell history:

```bash
DATABASE_URL="..." ADMIN_EMAIL="..." ADMIN_NAME="..." ADMIN_PASSWORD="..." npm run admin:create
```

Run it from a checkout of the repository, not inside the container: the standalone image does not include the scripts. The password needs at least 12 characters. Admins create the other users from the dashboard.

## Building the image locally

```bash
docker build --build-arg SITE_URL=https://mrdesign.agency -t mrdesign .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://mrdesign:mrdesign@host.docker.internal:5434/mrdesign" \
  -e BETTER_AUTH_SECRET="local-only-secret" -e BETTER_AUTH_URL="http://localhost:3000" \
  mrdesign
```

`host.docker.internal` reaches the local Docker Compose database from inside the container on Docker Desktop.

During `npm run build` you will see `BetterAuthError: You are using the default secret` logged a few times while Next collects page data. It is harmless: the build has no secret on purpose, and the error stops nothing (the build exits 0). The running container must have `BETTER_AUTH_SECRET`.

### Antivirus HTTPS scanning

Antivirus web shields that intercept HTTPS (Avast, for example) sign connections with their own root certificate, which containers do not trust. The build then fails at `apk add` with `TLS: server certificate not trusted`. Easypanel is not affected. To build locally, pause the HTTPS scanning or exclude `dl-cdn.alpinelinux.org` and `registry.npmjs.org`.

## Verified locally

The standalone server was run the way the image runs it (`node server.js`, `HOSTNAME=0.0.0.0`, `public` and `.next/static` copied next to it), behind proxy headers like Easypanel's (`Host`, `X-Forwarded-Host`, `X-Forwarded-Proto: https`):

- `/`, `/en`, services, portfolio, contact, blog and the sitemap answer 200; `/es` redirects to `/`; an unknown landing answers 404.
- `/admin` redirects to the login, `POST /api/blog` without a key answers 401, and static files under `/brand` answer 200.
- Redirect `Location` headers are relative, the canonical URL uses the public domain, and the security headers are sent.
