# Brief de Execução para o Claude Code — MVP "Páginas"

> **Objetivo do dia:** construir e fazer deploy de um MVP funcional ponta-a-ponta de uma app de acompanhamento terapêutico diário, bilingue (PT-PT / EN), com frontend, backend, base de dados, e deploy na VPS + Cloudflare.
> **Stack decidida:** Next.js (App Router) + Node + PostgreSQL.
> **Ler primeiro:** `01_documento_de_conceito.md` (contexto de produto). Este ficheiro é o plano técnico.

---

## 0. Como usar este documento

Este é o briefing para uma sessão autónoma do Claude Code. Cola-o (ou aponta o Claude Code para ele) no arranque da sessão. Está organizado por fases; segue-as por ordem. Faz commits frequentes e legíveis. **Não inventes credenciais nem reivindicações clínicas no copy.** Onde precisares de segredos (DB, domínio, tokens Cloudflare), para e pede ao Nuno.

### Princípios de trabalho
- Trabalha em incrementos pequenos e testáveis; corre a app localmente após cada fase.
- Prioriza um caminho feliz funcional ponta-a-ponta antes de polir.
- Escreve testes para a lógica do motor de personalização e para os endpoints de autenticação.
- Mantém o copy de bem-estar, **nunca clínico** ("apoio", "lembrete", "bem-estar" — nunca "tratamento", "cura", "diagnóstico").
- Acessibilidade e tom calmo desde o início (contraste, foco visível, sem padrões ansiogénicos).

---

## 1. Visão técnica geral

```
┌─────────────────────────────────────────────────┐
│  Cloudflare (DNS, CDN, SSL, proxy)               │
│   ├── app.<dominio>      → VPS (Next.js app)     │
│   └── <dominio>          → landing (Next.js)     │
└─────────────────────────────────────────────────┘
                      │
            ┌─────────▼──────────┐
            │  VPS (Ubuntu)      │
            │  - Next.js (SSR/API via route handlers)
            │  - Node process (PM2)
            │  - PostgreSQL
            │  - Nginx (reverse proxy → :3000)
            │  - Certbot/Cloudflare Origin Cert
            └────────────────────┘
```

Decisão de arquitetura: para o MVP, usar **Next.js full-stack** (App Router + Route Handlers para a API) reduz a complexidade — um só deployável. Postgres acedido via **Prisma**. i18n com **next-intl**.

---

## 2. Stack e bibliotecas

- **Framework:** Next.js 14+ (App Router, TypeScript).
- **Estilos:** Tailwind CSS. Paleta calma, tipografia legível.
- **ORM:** Prisma + PostgreSQL.
- **Auth:** Auth.js (NextAuth) com email/password (credenciais) + sessão por cookie. Hash com bcrypt/argon2.
- **i18n:** next-intl (PT-PT default, EN). Todas as strings de UI e conteúdo via dicionários/registos traduzíveis.
- **Validação:** Zod.
- **Email (fase posterior):** placeholder de provider (Resend/SMTP) — não bloquear o MVP nisto.
- **Process manager:** PM2.
- **Reverse proxy:** Nginx.
- **Testes:** Vitest + Playwright (smoke E2E do caminho feliz).

---

## 3. Modelo de dados (Prisma schema — ponto de partida)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  displayName   String?
  locale        String   @default("pt-PT")  // "pt-PT" | "en"
  role          Role     @default(INDIVIDUAL) // INDIVIDUAL | THERAPIST
  promptHour    Int      @default(8)          // hora preferida (0-23)
  createdAt     DateTime @default(now())

  themes        UserTheme[]
  checkIns      MoodCheckIn[]
  journalEntries JournalEntry[]
  deliveries    PromptDelivery[]
  // ligação terapeuta-cliente
  therapistLink ClientLink[] @relation("ClientSide")
  clientLinks   ClientLink[] @relation("TherapistSide")
}

enum Role { INDIVIDUAL THERAPIST }

model Theme {
  id        String @id @default(cuid())
  slug      String @unique           // "anxiety", "grief", "boundaries"...
  // textos traduzíveis
  nameI18n  Json                     // { "pt-PT": "...", "en": "..." }
  pieces    ContentPiece[]
  userThemes UserTheme[]
}

model UserTheme {
  id      String @id @default(cuid())
  user    User   @relation(fields: [userId], references: [id])
  userId  String
  theme   Theme  @relation(fields: [themeId], references: [id])
  themeId String
  weight  Int    @default(1)  // intensidade do interesse
  @@unique([userId, themeId])
}

model ContentPiece {
  id          String   @id @default(cuid())
  type        PieceType                 // METAPHOR | REMINDER | EXERCISE | REFLECTION
  principle   String                    // "ACT_defusion", "self_compassion"...
  bodyI18n    Json                      // { "pt-PT": "...", "en": "..." }
  moodFit     String[]                  // estados emocionais adequados
  depth       Int      @default(1)      // 1=leve ... 3=profundo
  themeId     String?
  theme       Theme?   @relation(fields: [themeId], references: [id])
  createdAt   DateTime @default(now())
  deliveries  PromptDelivery[]
}

enum PieceType { METAPHOR REMINDER EXERCISE REFLECTION }

model PromptDelivery {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  piece     ContentPiece @relation(fields: [pieceId], references: [id])
  pieceId   String
  date      DateTime @default(now())
  opened    Boolean  @default(false)
  @@unique([userId, date])
}

model MoodCheckIn {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  mood      Int      // escala 1-5
  note      String?
  createdAt DateTime @default(now())
}

model JournalEntry {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  body      String   // cifrar em repouso (fase posterior)
  pieceId   String?  // se for resposta a um prompt
  createdAt DateTime @default(now())
}

// Ponte terapeuta ↔ cliente
model ClientLink {
  id          String  @id @default(cuid())
  therapist   User    @relation("TherapistSide", fields: [therapistId], references: [id])
  therapistId String
  client      User    @relation("ClientSide", fields: [clientId], references: [id])
  clientId    String
  inviteCode  String  @unique
  status      String  @default("pending") // pending | active
  seededThemes Json?  // temas semeados após a última sessão
  @@unique([therapistId, clientId])
}
```

---

## 4. Motor de personalização (MVP — baseado em regras)

Função `selectDailyPiece(userId, date)`:

1. Recolhe os temas do utilizador (`UserTheme`, ponderados) e o último `MoodCheckIn`.
2. Se for cliente de um terapeuta com `seededThemes`, dá prioridade a esses temas durante a semana após a sessão.
3. Filtra `ContentPiece` por: tema correspondente + `moodFit` compatível com o humor recente + `depth` adequado (não servir conteúdo profundo num dia de humor baixo).
4. Exclui peças já entregues recentemente (ver `PromptDelivery`).
5. **Pondera o tipo:** garantir variedade, mas com viés para `METAPHOR` (formato-âncora do produto).
6. Escolhe de forma determinística-por-dia (seed = userId+date) para idempotência.
7. Regista em `PromptDelivery`.

Escrever testes unitários cobrindo: sem humor registado, humor baixo (evitar profundidade), temas semeados pelo terapeuta têm prioridade, não repetição.

---

## 5. Páginas e rotas

**App (autenticada):**
- `/[locale]/onboarding` — escolha de temas, papel (indivíduo/terapeuta), hora do prompt.
- `/[locale]/today` — prompt do dia + ação (marcar como lido, ir para journaling).
- `/[locale]/checkin` — check-in de humor (1–5 + nota).
- `/[locale]/journal` — lista + editor de entradas (privado).
- `/[locale]/journey` — visão suave de continuidade (sem streaks agressivos).
- `/[locale]/settings` — locale, hora do prompt, conta.

**Modo terapeuta:**
- `/[locale]/therapist` — lista de clientes, gerar código de convite.
- `/[locale]/therapist/[clientId]` — semear temas após sessão.

**Cliente liga-se:** `/[locale]/connect?code=...`

**Público:**
- `/[locale]` — landing (proposta de valor, disclaimer de bem-estar, CTA).
- `/[locale]/privacy`, `/[locale]/terms` — incluir disclaimer não-clínico e nota RGPD.

**API (Route Handlers):** `/api/auth/*`, `/api/today`, `/api/checkin`, `/api/journal`, `/api/themes`, `/api/therapist/seed`, `/api/connect`.

---

## 6. Conteúdo semente (seed)

Criar um `seed.ts` com, no mínimo:
- 8 temas (ansiedade, luto, fronteiras, autocrítica, relações, trauma, transições, raiva).
- ~40 peças de conteúdo (≥5 por tema), **bilingues PT/EN**, distribuídas pelos quatro tipos, com viés para metáforas.
- Exemplo de metáfora (ACT): "as folhas no rio", "o passageiro no autocarro"; auto-compaixão: "a voz do amigo".

**Aviso:** este conteúdo semente é um ponto de partida e deve ser marcado para **revisão por profissional** antes de produção real. Não inventar afirmações clínicas.

---

## 7. Ordem de execução (fases do dia)

1. **Scaffold** — `create-next-app` (TS, Tailwind, App Router), git init, estrutura de pastas, next-intl configurado (PT-PT/EN).
2. **Base de dados** — Prisma + schema acima, `prisma migrate`, ligar ao Postgres local; `seed.ts`.
3. **Auth** — Auth.js credenciais, registo/login, sessão, proteção de rotas.
4. **Onboarding** — fluxo de temas/papel/hora.
5. **Motor + /today** — `selectDailyPiece` + página do prompt diário + testes.
6. **Check-in + Journal** — humor e journaling.
7. **Modo terapeuta** — convite por código + semear temas.
8. **Journey + Settings** — continuidade suave + preferências.
9. **Landing + legais** — landing bilingue + privacidade/termos com disclaimer.
10. **Testes** — Vitest (motor, auth) + um smoke E2E Playwright do caminho feliz.
11. **Deploy** — ver secção 8.
12. **Verificação final** — checklist da secção 9.

---

## 8. Deploy (VPS + Cloudflare)

> **Pré-requisitos a pedir ao Nuno:** IP/acesso SSH da VPS, nome de domínio, e acesso à conta Cloudflare (ou que ele configure os registos quando indicado). **Não prosseguir sem estes.**

**Na VPS (Ubuntu):**
1. Instalar Node LTS, PostgreSQL, Nginx, PM2, git.
2. Criar BD e utilizador Postgres; guardar `DATABASE_URL` em `.env` (não commitar).
3. `git clone` do repositório; `npm ci`; `npx prisma migrate deploy`; `npm run seed`; `npm run build`.
4. Arrancar com PM2: `pm2 start npm --name paginas -- start` (porta 3000); `pm2 save`.
5. Configurar Nginx como reverse proxy `:80/:443 → :3000`.

**No Cloudflare:**
1. Registo `A` de `app.<dominio>` (e `@`/`www`) a apontar para o IP da VPS, **proxied** (laranja).
2. SSL/TLS em modo **Full (strict)**; instalar **Origin Certificate** do Cloudflare no Nginx.
3. Ativar Always Use HTTPS, HSTS, e cache de assets estáticos.
4. (Opcional) Regras de firewall/rate-limiting nos endpoints de auth.

**Variáveis de ambiente necessárias:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DEFAULT_LOCALE`. Pedir/gerar com segurança.

> Nota: a decisão foi VPS para o backend/app. O Cloudflare entra como DNS/CDN/SSL à frente da VPS. (Caso no futuro se queira mover páginas estáticas para Cloudflare Pages, a landing é a candidata natural.)

---

## 9. Checklist de verificação final

- [ ] Registo, login e logout funcionam; rotas protegidas redirecionam.
- [ ] Onboarding guarda temas, papel e hora.
- [ ] `/today` mostra uma peça personalizada e idempotente no mesmo dia.
- [ ] Check-in de humor influencia a seleção do dia seguinte.
- [ ] Journaling cria/lê entradas privadas.
- [ ] Terapeuta gera código; cliente liga-se; temas semeados ganham prioridade.
- [ ] Alternância PT-PT / EN funciona em toda a UI e conteúdo.
- [ ] Landing tem disclaimer de bem-estar (não-clínico) e nota RGPD.
- [ ] Testes do motor e auth passam; smoke E2E passa.
- [ ] App acessível via HTTPS no domínio, através do Cloudflare.
- [ ] Segredos fora do repositório; `.env.example` documentado.

---

## 10. Fora do âmbito de hoje (registar para depois)

Notificações push/email à hora escolhida; cifragem em repouso do journaling; geração de metáforas por IA; apps nativas/PWA polida; dashboard de métricas do terapeuta; pagamentos/subscrições; revisão clínica formal do conteúdo.

---

## 11. Prompt de arranque sugerido para o Claude Code

> "Lê `01_documento_de_conceito.md` e `02_brief_claude_code.md`. Vais construir o MVP descrito na secção 7, por fases, com a stack Next.js + Prisma + PostgreSQL, bilingue PT-PT/EN. Começa pela Fase 1 (scaffold). Faz commits por fase, corre a app localmente após cada fase, e para e pergunta-me sempre que precisares de segredos (DATABASE_URL, domínio, acesso SSH/Cloudflare). Não escrevas copy clínico — só linguagem de bem-estar. No fim, percorre a checklist da secção 9."
