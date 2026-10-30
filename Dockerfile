# Сборка и запуск сайта TrustGuard AI в одном образе (Next.js standalone)

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* подставляются в код при сборке
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_YM_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_YM_ID=$NEXT_PUBLIC_YM_ID
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Сборка останавливается, пока на сайте остались [заглушки], пустые реквизиты или адрес localhost
# (scripts/check-placeholders.mjs). Черновик для проверки: ALLOW_PLACEHOLDERS=1 docker compose build.
# На боевом сервере переменную не задавайте.
ARG ALLOW_PLACEHOLDERS
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    LEADS_DIR=/app/data
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data && chmod 700 /app/data
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
