# Prompt de arranque para o Claude Code

Lê `docs/01_documento_de_conceito.md` e `docs/02_brief_claude_code.md`.

O scaffold, dependências, schema Prisma e o seed (365 peças em `data/content_365.json`)
já estão prontos. A tua missão é implementar o MVP descrito na secção 7 do brief, por fases:

1. Configura o Postgres local, copia `.env.example` para `.env` e corre:
   `npx prisma migrate dev --name init && npm run seed`
2. Auth.js (credenciais email/password) + proteção de rotas.
3. i18n com next-intl (pt-PT default, en).
4. Onboarding (temas, papel, hora) → /today (motor selectDailyPiece) → check-in → journal.
5. Modo terapeuta (convite por código + semear temas).
6. Journey + Settings; landing bilingue + privacidade/termos (disclaimer de bem-estar, não-clínico).
7. Testes (motor + auth) e smoke E2E.
8. Deploy na VPS + Cloudflare (secção 8 do brief). PEDE os segredos ao Nuno (DATABASE_URL,
   domínio, acesso SSH/Cloudflare) — não os inventes.

Regras: copy só de bem-estar, nunca clínico. Commits por fase. Corre a app após cada fase.
No fim, percorre a checklist da secção 9 do brief.
