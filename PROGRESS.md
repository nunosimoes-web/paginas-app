# PROGRESS — MVP Páginas

---

# 🟢 URL PÚBLICO — partilhável já

## ➡️  https://paginas.178.104.201.64.sslip.io

App em produção, HTTPS com certificado Let's Encrypt válido.
Partilhável com psicólogos e testers. Registo aberto em `/register`.

---

> Estado honesto da construção. Atualizado em 2026-05-21.

## Resumo

O MVP ponta-a-ponta está **construído, containerizado e EM PRODUÇÃO**, acessível
num URL público HTTPS. Os testes passam, a build de produção é bem-sucedida e o
**deploy remoto está concluído** via Coolify (ver secção Deploy).

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
| 12 — Deploy remoto | ✅ | Coolify: app + Postgres gerido; URL público HTTPS |

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

## Correções pós-deploy

- **Onboarding preso em "A guardar"** — a server action gravava bem, mas a
  navegação suave (`router.push`) a seguir à action era descartada, deixando o
  botão preso. Corrigido com navegação forte (`window.location`) + `try/catch`.
- **Logout preso** — o `signOut` não saía da área autenticada. Corrigido com
  `signOut({redirect:false})` + navegação forte. `AuthForm` (login) reforçado
  com o mesmo padrão por precaução.
- **Healthcheck** — `node:alpine` não traz `curl`/`wget`; o Coolify precisa de
  um deles. Adicionado `curl` à imagem + `HEALTHCHECK` nativo. App `running:healthy`.
- Auditados os 13 componentes com ações: só o onboarding e o logout tinham o
  padrão problemático (navegar a seguir a uma ação); os outros 10 usam o padrão
  correto (`router.refresh()` + `useTransition`).

## Funcionalidades pós-MVP

- **Email diário** — `POST /api/cron/send-emails` envia a peça do dia à
  `promptHour` de cada utilizador (template PT/EN, Resend). Tarefa agendada do
  Coolify de hora a hora. Idempotente via `PromptDelivery.emailSentAt`.
  Domínio `leadshortcut.com` verificado na Resend (DKIM/SPF/MX no Cloudflare);
  remetente `paginas@leadshortcut.com` — entrega a qualquer destinatário.
- **Opt-in / cancelamento** — `User.emailDaily` (interruptor nas definições);
  link de cancelamento + header `List-Unsubscribe` nos emails; página
  `/unsubscribe` + `POST /api/unsubscribe` (token HMAC, sem login).
- **Relatório diário** — `POST /api/cron/daily-report` envia para `REPORT_EMAIL`
  um resumo de utilização (métricas + tabela por utilizador). Tarefa agendada
  diária (07h UTC).
- **Landing page** reformulada — hero com pré-visualização da peça, secções
  "como funciona" e "para terapeutas", CTA final.
- **/review** — as 365 peças para revisão profissional (PT+EN) + exportação
  CSV (`/api/review/export`). Privada: exige `?k=REVIEW_KEY`; fora do rodapé.
- **Apagar conta (RGPD)** — ação `deleteAccount` + botão nas definições; apaga
  a conta e todos os dados dependentes e termina a sessão.
- **Recuperação de palavra-passe** — `/forgot-password` + `/reset-password`;
  `PasswordResetToken` (token de uso único, validade 1h); link no login.
- **Suporte** — `/support` + `POST /api/support` (email para a equipa); ligação
  na navegação e no rodapé. `error.tsx` — fronteira de erro calma com link
  para o suporte.

## Resiliência

- **Backup diário** da BD às 03h00 (Coolify, retenção local).
- **Healthcheck** ativo → o Coolify reinicia a app sozinho se ficar sem resposta.
- **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** fixada → sem "Failed to find Server
  Action" entre redeploys.
- **Snapshot manual** dos dados em `../backups/` (fora do servidor).
- ⚠️ Backups só locais ao servidor — falta destino externo (S3/R2) para
  sobreviver à perda do servidor.

## Pendente

- **Backup externo** (S3/R2) — os backups são locais ao servidor.
- Migrar o remetente de email para um domínio próprio da marca quando
  `paginasemetaforas.pt` estiver disponível no Cloudflare (hoje usa
  `leadshortcut.com` como solução temporária).
- Teste E2E de browser dos *server actions* (check-in, journal, connect).

## Deploy — concluído (Coolify)

**URL público:** https://paginas.178.104.201.64.sslip.io

Infraestrutura provisionada via API do Coolify (`painel.leadshortcut.com`, v4.0.0):

- **Servidor:** `localhost` do Coolify (IP público `178.104.201.64`), Docker saudável.
- **Projeto:** `Paginas` → ambiente `production`.
- **Postgres de produção:** base de dados gerida pelo Coolify, dedicada à app,
  isolada de outros projetos; ligação interna na rede Docker do Coolify (sem
  porta pública — exposição apenas temporária durante a verificação, já fechada).
- **Aplicação:** build pack Dockerfile, a partir do repositório Git
  `github.com/nunosimoes-web/paginas-app` (branch `main`, público — sem segredos).
- **Domínio:** `paginas.178.104.201.64.sslip.io` (magic DNS sobre o IP público),
  TLS Let's Encrypt automático (certificado `R13` válido, HTTP/2).
- **Variáveis:** `DATABASE_URL` (Postgres do Coolify), `NEXTAUTH_SECRET`,
  `NEXTAUTH_URL` (= URL público), `DEFAULT_LOCALE=pt-PT`.

O `runner` do Dockerfile foi ajustado para correr, no arranque,
`prisma migrate deploy` → `prisma db seed` (idempotente) → `node server.js`.
Logs de produção confirmam: 3 migrações aplicadas e **"Seed concluído: 9 temas,
365 peças"**.

### Smoke test ao URL público (HTTPS, curl)

| Verificação | Resultado |
|---|---|
| `GET /` (home) | **200** — HTTPS, cert Let's Encrypt válido |
| `GET /en` (troca de locale) | **200** |
| `GET /login`, `/register`, `/privacy`, `/terms` | **200** |
| `GET /today` sem sessão | **307** → redireciona para login |
| `POST /api/register` | **201** — utilizador criado |
| Login NextAuth (`callback/credentials`) | **200** + sessão com `user.id` |
| `GET /today` autenticado (PT) | **200** — peça do dia renderizada (Metáfora, tema Ansiedade) |
| `GET /en/today` autenticado (EN) | **200** — mesma peça, traduzida |

BD de produção verificada: **365 peças**, **9 temas**, **365 com `needsReview=true`**.

## Invioláveis respeitados

- Copy de bem-estar, nunca clínico.
- As 365 peças mantêm `needsReview = true`.
- Segredos fora do git (`.env`, `deploy.env` ignorados; `.env` fora da imagem).
- BD da Páginas isolada (Postgres dedicado, sem tocar noutros projetos).
