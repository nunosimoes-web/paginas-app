# syntax=docker/dockerfile:1
# ---- Páginas — imagem multi-stage (Next.js standalone + Prisma 7) ----

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- migrator: imagem com a CLI Prisma para migrar/semear (one-shot) ----
FROM node:24-alpine AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY data ./data
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

# ---- runner: a app, output standalone + toolchain de migração ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# curl: necessário para o healthcheck (Coolify e o HEALTHCHECK abaixo).
RUN apk add --no-cache curl && addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Toolchain para migrate + seed no arranque (prisma CLI, ts-node, schema, dados).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts /app/tsconfig.json ./
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# start-period generoso: o arranque corre migrate + seed antes de o servidor subir.
HEALTHCHECK --interval=15s --timeout=8s --start-period=120s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/ || exit 1
CMD ["./docker-entrypoint.sh"]
