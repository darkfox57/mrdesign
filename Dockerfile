# syntax=docker/dockerfile:1
# Production image for Easypanel. npm, Node 24 and a Prisma client
# generated into src/generated (bundled by Next).

# ---- Base ----
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
# postinstall runs `prisma generate`, which needs the schema and config (no database).
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .

# Pages are rendered at build time, so the public URL used for metadata and the
# sitemap is fixed here. Pass it as a build argument in Easypanel.
ARG SITE_URL="https://mrdesign.agency"
ENV SITE_URL=${SITE_URL}
# next.config.ts builds the next/image allowlist from the bucket's public URL at build time.
# Without it the site still works, but no image from the media library loads.
ARG R2_PUBLIC_URL=""
ENV R2_PUBLIC_URL=${R2_PUBLIC_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Runtime ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# DATABASE_URL is read at runtime; set it in Easypanel's environment, never in the image.
CMD ["node", "server.js"]
