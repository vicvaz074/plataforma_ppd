FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN apk add --no-cache libc6-compat wget \
  && corepack enable

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM deps AS build

WORKDIR /app

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_ENABLE_EXTERNAL_ASSISTANT=false

RUN pnpm build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV UPLOADS_DIR=/app/uploads
ENV NEXT_PUBLIC_ENABLE_EXTERNAL_ASSISTANT=false

RUN addgroup -S nodejs \
  && adduser -S davara -G nodejs \
  && mkdir -p /app/uploads /app/logs \
  && chown -R davara:nodejs /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.js ./next.config.js
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/security-headers.cjs ./security-headers.cjs

USER davara

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "./node_modules/next/dist/bin/next", "start"]
