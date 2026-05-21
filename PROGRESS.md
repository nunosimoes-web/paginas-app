# PROGRESS — MVP Páginas

> Estado honesto da construção. Atualizado em 2026-05-21.

## Resumo

O MVP ponta-a-ponta está **construído, a correr localmente e containerizado**.
Os testes passam e a build de produção é bem-sucedida. O **deploy remoto** está
**bloqueado por decisões/acessos que precisam do Nuno** (ver secção Deploy).

## Stack final

- Next.js 16.2.6 (App Router, Turbopack) + TypeScript
- Prisma 7 com **driver adapter** (`@prisma/adapter-pg`) — Prisma 7 deixou de
  aceitar `url` no `schema.prisma`; a ligação vive em `prisma.config.ts`
- PostgreSQL 16 (Docker)
- Auth.js (NextAuth v4) — credenciais email/password, sessão JWT, bcrypt
- next-intl 4.12 — pt-PT (default) + en; o antigo `middleware` é agora `proxy.ts`
- Tailwind v4; identidade calma "papel"

## Fases (0–10) — concluídas

| Fase | Estado | Notas |
|---|---|---|
| 0 — BD, migração, seed | ✅ | 9 temas + 365 peças; 12 testes do motor verdes |
| 1 — i18n | ✅ | pt-PT/en, troca de idioma, dicionários completos |
| 2 — Auth | ✅ | registo/login/logout, rotas protegidas |
| 3 — Onboarding | ✅ | temas / papel / hora |
| 4 — /today | ✅ | liga `selectDailyPiece`; idempotente por dia |
| 5 — Check-in | ✅ | humor 1–5 + nota; alimenta o motor |
| 6 — Journaling | ✅ | entradas privadas; resposta a uma peça |
| 7 — Modo terapeuta | ✅ | código de convite, ligação, sementeira de temas |
| 8 — Journey + Settings | ✅ | continuidade suave; preferências |
| 9 — Landing + legais | ✅ | disclaimer de bem-estar, RGPD, apoio em crise |
| 10 — Testes | ✅ | 31 testes (motor, password, validação, smoke HTTP) |
| 11 — Containerizar | ✅ | Dockerfile + compose; stack verificada localmente |
| 11 — Deploy remoto | ⏸️ | bloqueado — ver abaixo |

## O que está verificado (como)

- **Motor de personalização** — 12 testes unitários (`engine.test.ts`).
- **Auth / rotas protegidas / i18n** — smoke E2E HTTP (`tests/smoke.test.ts`):
  registo, registo duplicado (409), login por credenciais, sessão com `user.id`,
  acesso a rota protegida autenticado, redireccionamento de anónimos e de
  utilizadores sem onboarding.
- **/today** — verificado via HTTP: 200, peça renderizada, segunda visita reutiliza
  a mesma entrega (idempotência confirmada na BD).
- **Build de produção** — `npm run build` bem-sucedido (output standalone).
- **Container** — `docker compose up` corre BD + migração + seed (365 peças) + app;
  registo/login/sessão/rotas protegidas verificados contra o container.

## O que falta exercitar via UI

Os *server actions* de mutação (onboarding, check-in, journal, connect, seed de
temas) estão implementados, com TypeScript sem erros e seguindo o mesmo padrão
verificado do registo, mas a submissão através da UI ainda **não foi percorrida
por um teste automatizado de browser**. Recomenda-se uma passagem manual ou um
E2E Playwright (fora do âmbito do dia — Playwright não foi instalado para não
depender de download de browsers).

## Deploy — bloqueios concretos

O runbook assumia um caminho direto; na prática faltam peças:

1. **Como entregar o código ao Coolify.** O Coolify (`painel.leadshortcut.com`,
   v4.0.0, 1 servidor utilizável) faz deploy a partir de um repositório Git ou de
   uma imagem de registo. O repositório local **não tem remote** e não há
   credenciais de registo. Publicar o código (ex.: GitHub) é uma decisão do Nuno.
2. **Cloudflare.** `CLOUDFLARE_API_TOKEN` está vazio em `deploy.env`
   ("TODO: cria token"). Sem ele não há gestão de DNS/SSL por API.
3. **Domínio / IP público.** Não há domínio dedicado; o servidor Coolify reporta
   apenas o IP interno (`10.0.1.1`), pelo que o fallback `sslip.io` precisaria do
   IP público.
4. **Hetzner.** `HETZNER_API_TOKEN` está vazio — sem caminho VPS direto.

**Decisão pendente do Nuno:** escolher como entregar o código (publicar num Git
remoto vs. deploy manual no painel Coolify) e fornecer o token Cloudflare + IP
público (ou aceitar o domínio automático do Coolify).

## Invioláveis respeitados

- Copy de bem-estar, nunca clínico.
- As 365 peças mantêm `needsReview = true`.
- Segredos fora do git (`.env`, `deploy.env` ignorados; `.env` fora da imagem).
- BD da Páginas isolada (Postgres dedicado, sem tocar noutros projetos).
