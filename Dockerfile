# -------------------------------------------------------------
# Base layer with Bun and Python3 (for helper scripts if needed)
# -------------------------------------------------------------
FROM oven/bun:1.4-alpine AS base
RUN apk add --no-cache libc6-compat tar gzip

# -------------------------------------------------------------
# Dependencies installation layer
# -------------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# -------------------------------------------------------------
# Builder layer
# -------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# -------------------------------------------------------------
# Production runner layer
# -------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Public assets
COPY --from=builder /app/public ./public

# Standalone output bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
