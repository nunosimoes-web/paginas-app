# Bailarico — imagem de produção (app + API fal.ai)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner
ENV NODE_ENV=production PORT=3000 CACHE_DIR=/app/cache
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/package.json ./package.json
RUN mkdir -p /app/cache && chown -R node:node /app
USER node
VOLUME ["/app/cache"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -fsS http://localhost:3000/health || exit 1
CMD ["node", "dist-server/server/index.js"]
