# ======================================================================================
# Market Sentinel Dockerfile
# ======================================================================================

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sentinel

# Copy built application
COPY --from=builder --chown=sentinel:nodejs /app/dist ./dist
COPY --from=builder --chown=sentinel:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sentinel:nodejs /app/package.json ./package.json

USER sentinel

EXPOSE 3010

ENV PORT 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3010/health || exit 1

CMD ["node", "dist/server.js"]