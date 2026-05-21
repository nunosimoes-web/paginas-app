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

# ---- runner: a app, output standalone ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
