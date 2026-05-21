#!/bin/sh
# Páginas — arranque do container runner.
# Aplica migrações, semeia o conteúdo (idempotente) e arranca o servidor Next.js.
set -e

echo "[entrypoint] prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] prisma db seed (idempotente — upsert)..."
npx prisma db seed || echo "[entrypoint] AVISO: seed falhou; a continuar (pode correr-se à mão)."

echo "[entrypoint] a arrancar o servidor Next.js (server.js)..."
exec node server.js
