# Prompt de Arranque Autónomo — Claude Code constrói o MVP "Páginas" de A a Z

> Cola este ficheiro inteiro como primeira mensagem ao Claude Code, na pasta do projeto
> (a que o `bootstrap.sh` criou). Foi desenhado para o tornar **autónomo, resiliente e
> criativo** — capaz de avançar sozinho do princípio ao fim, parando só no que exige
> uma decisão humana ou um segredo.

---

## A tua missão

Constrói e faz deploy de um MVP funcional ponta-a-ponta da app **Páginas** — uma app de
acompanhamento terapêutico diário que entrega, todos os dias, uma peça de conteúdo
(metáfora, lembrete, exercício ou reflexão) personalizada à pessoa. Bilingue PT-PT / EN.
Stack: Next.js (App Router, TS) + Prisma + PostgreSQL. Serve dois públicos: uso individual
e integração com terapeuta.

Lê primeiro, por esta ordem:
1. `docs/01_documento_de_conceito.md` — o porquê e o quê do produto.
2. `docs/02_brief_claude_code.md` — o plano técnico, fases e checklist (a tua fonte de verdade).
3. `src/lib/engine.ts` e `src/lib/engine.test.ts` — o motor de personalização **já implementado e testado**. Não o reescrevas; liga-o.

O que já está feito por ti: scaffold Next.js, dependências, `prisma/schema.prisma`,
importador de seed, as **365 peças** em `data/content_365.json`, e o **motor `selectDailyPiece`**
(núcleo `pickPiece` puro, determinístico e resiliente, com testes a passar).

---

## Como trabalhar (princípios)

**Autonomia.** Avança sem pedir permissão para cada passo. Toma decisões de implementação
razoáveis e segue. Só interrompes para (a) segredos/acessos, (b) decisões de produto
irreversíveis, ou (c) um bloqueio que não consegues resolver após tentar a sério.

**Resiliência.** Quando algo falha, não desistes nem ficas à espera: lê o erro, forma uma
hipótese, tenta uma correção, e repete. Se uma abordagem bate contra uma parede após ~3
tentativas honestas, muda de estratégia e regista porquê num `PROGRESS.md`. Mantém a app
sempre num estado que arranca — faz commits pequenos e frequentes para teres pontos de
retorno seguros.

**Criatividade dentro dos trilhos.** Tens liberdade no design da UI, na microcópia (sempre
de bem-estar, **nunca clínica**), na arquitetura de componentes e na experiência. O conceito
e o brief são os limites; dentro deles, faz escolhas que tornem o produto calmo, bonito e
humano. Evita gamificação ansiogénica (sem "streaks" agressivos).

**Honestidade.** Não finjas que algo funciona. Se um teste falha ou um passo fica por
fazer, di-lo no `PROGRESS.md` e na tua mensagem final. Não inventes credenciais, dados,
nem afirmações terapêuticas.

**Disciplina de qualidade.** Após cada fase: corre a app (`npm run dev`), corre os testes
(`npm run test` / `npx vitest run`), e só então passas à fase seguinte. TypeScript sem
erros. Acessibilidade básica (contraste, foco visível, navegação por teclado).

---

## Ordem de execução (segue o brief, secção 7)

0. **Setup.** `cp .env.example .env`; pede ao Nuno `DATABASE_URL` e `NEXTAUTH_SECRET` se
   não existirem. `npx prisma migrate dev --name init && npm run seed`. Confirma 365 peças na BD.
1. **i18n** (next-intl, pt-PT default + en) com troca de idioma.
2. **Auth** (Auth.js, credenciais email/password, bcrypt), registo/login/logout, rotas protegidas.
3. **Onboarding** — temas, papel (indivíduo/terapeuta), hora do prompt.
4. **/today** — liga `selectDailyPiece(prisma, userId)` à UI; mostra a peça do dia, idempotente.
5. **Check-in de humor** (1–5 + nota) — alimenta a personalização do dia seguinte.
6. **Journaling** — criar/ler entradas privadas; responder a um prompt.
7. **Modo terapeuta** — gerar código de convite; cliente liga-se; semear temas (grava
   `seededThemes` como `{ slug: ISOdate }`, que o motor já sabe ler).
8. **Journey + Settings** — continuidade suave; preferências (locale, hora, conta).
9. **Landing + legais** — landing bilingue; privacidade/termos com **disclaimer de bem-estar
   (não substitui terapia)** e nota RGPD; mecanismo simples de encaminhamento para apoio em crise.
10. **Testes** — mantém os do motor a passar; acrescenta testes de auth e um smoke E2E do caminho feliz.
11. **Deploy** — VPS + Cloudflare (brief, secção 8). **Pede ao Nuno** IP/SSH, domínio e acesso
    Cloudflare. Nginx reverse proxy → :3000, PM2, `prisma migrate deploy`, seed, SSL Full (strict).
12. **Verificação final** — percorre a checklist da secção 9 do brief, item a item.

---

## Quando PARAR e perguntar ao Nuno

- Qualquer **segredo ou acesso**: `DATABASE_URL`, `NEXTAUTH_SECRET`, IP/SSH da VPS, domínio,
  tokens/credenciais Cloudflare. Nunca os inventes nem os adivinhes.
- **Decisões de produto irreversíveis ou ambíguas** que o conceito não cobre.
- Se um **link externo** suspeito ou inesperado surgir, confirma antes de seguir.

Para tudo o resto, decide e avança.

## Regras invioláveis

- Copy **de bem-estar, nunca clínico** (nada de "tratar", "curar", "diagnosticar").
- O conteúdo das 365 peças carece de **validação profissional** antes de produção real —
  mantém o campo `needsReview` e não o desligues.
- Dados sensíveis (journaling, humor) tratados com cuidado RGPD; segredos fora do git.
- Não reescrevas o motor sem motivo; se o melhorares, mantém os testes a passar.

## Entregável final

Uma app a correr (local e, com os acessos, em produção via Cloudflare), com a checklist
da secção 9 cumprida, testes a passar, e um `PROGRESS.md` que diz com honestidade o que
ficou feito, o que ficou pendente e porquê.

---

### Primeira ação sugerida

> "Li o conceito, o brief e o motor. Vou começar pela Fase 0 (setup da BD e seed).
> Para isso preciso do `DATABASE_URL` e de um `NEXTAUTH_SECRET` — confirmas-me esses
> valores, ou queres que eu gere um Postgres local e um secret de desenvolvimento para já?"

---

# Runbook de Deploy AUTÓNOMO — Hetzner (Docker) + Cloudflare

Tens TODOS os acessos em `../deploy.env` e o Nuno já confirmou: Hetzner pago e pronto,
Docker e Cloudflare (DNS + Workers) disponíveis. **Não peças mais acessos. Não esperes
por confirmações.** Resolve sozinho, de A a Z, e regista o que fizeste em PROGRESS.md.
Carrega os segredos com: `set -a; . ../deploy.env; set +a`.

**Filosofia:** és ágil e resiliente. Se um caminho falhar, escolhe o mais robusto e
segue (ex.: se um token de API estiver inválido, usa o CLI já autenticado — `hcloud`,
`wrangler` — ou o SSH). A única coisa que NÃO podes fazer é apagar recursos/dados de
OUTROS projetos. A Páginas tem a sua própria base de dados, isolada.

## 0. Base de dados própria (Postgres em Docker) — NUNCA reutilizar a de outro projeto
- Local (para migrar/seed durante o build): sobe um Postgres em Docker:
  `docker run -d --name paginas-db -e POSTGRES_PASSWORD=paginas -e POSTGRES_DB=paginas -p 5433:5432 postgres:16`
  e usa `DATABASE_URL="postgresql://postgres:paginas@localhost:5433/paginas"` no `.env`.
- `npx prisma migrate dev --name init && npm run seed && npm run test`. Confirma 365 peças.

## 1. Construir a app (Fases 1–10 do AUTONOMOUS_PROMPT acima)
- Implementa o MVP completo. Corre `npm run build` e `npm run test` (têm de passar).
- Containeriza: escreve um `Dockerfile` (Next.js standalone) e um `docker-compose.yml`
  com dois serviços — `web` (a app) e `db` (postgres:16, volume persistente). A app lê
  `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` do ambiente do compose.

## 2. Deploy — escolhe o caminho que FUNCIONA (não dependas de um único token)
Ordem de preferência, pelo que está realmente disponível:

**(a) Coolify (PREFERIDO — a API verificou OK no preflight).** O Coolify já gere uma VPS.
- `GET ${COOLIFY_BASE_URL}/api/v1/servers` e `/api/v1/projects` (Bearer `$COOLIFY_API_TOKEN`).
- Cria um projeto + recurso a partir do repositório Git (ou Dockerfile/compose), define as
  variáveis de ambiente (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL), e dispara o deploy
  via API. O Coolify trata do container, do Postgres (cria um recurso de BD dedicado), do
  TLS e até de um domínio (`sslip.io`/domínio próprio do Coolify) automaticamente.
- Usa o Postgres gerido pelo Coolify como BD de produção (não o container local de dev).

**(b) Hetzner direto (se o `HETZNER_API_TOKEN` estiver preenchido/válido).**
- `curl -H "Authorization: Bearer $HETZNER_API_TOKEN" https://api.hetzner.cloud/v1/servers`
  (ou `hcloud server list`). Usa o servidor existente; só cria novo se não houver nenhum.
- Garante Docker (`curl -fsSL https://get.docker.com | sh`), copia o projeto (rsync/git),
  `docker compose up -d --build`, depois `docker compose exec web npx prisma migrate deploy && ... npm run seed`.

Se nenhum token de deploy funcionar, regista o bloqueio EXATO no PROGRESS.md (que chave
falta), mas entrega na mesma a app construída, testada e containerizada, pronta a subir.

## 3. Domínio + Cloudflare (DNS + SSL) — NÃO encraves aqui
O Nuno NÃO tem domínio dedicado para este projeto. Resolve sozinho, por esta ordem:

1. **Subdomínio temporário numa zona que ele já controla (preferido).**
   Lista as zonas da conta: `GET https://api.cloudflare.com/client/v4/zones`
   (Bearer `$CLOUDFLARE_API_TOKEN`) — ou `wrangler` se o token falhar. Escolhe a 1ª zona
   ativa e cria um subdomínio dedicado, ex.: `paginas-mvp.<zona>`:
   `POST .../zones/<ZONE_ID>/dns_records {type:"A", name:"paginas-mvp", content:"<IP_VPS>", proxied:true}`.
   Define esse host como `NEXTAUTH_URL` (https) e nas variáveis do compose. SSL/TLS Full (strict).
2. **Fallback sem Cloudflare (se não houver zona utilizável):** usa DNS curinga sobre o IP —
   `http(s)://<IP-com-tracos>.sslip.io` (ex.: `1.2.3.4` → `1-2-3-4.sslip.io`). Um Caddy em
   Docker na VPS emite automaticamente o certificado Let's Encrypt para esse host. Funciona
   de imediato, sem registar nada.
3. Escreve no PROGRESS.md o URL final que ficou ativo, seja qual for o caminho.

Em qualquer dos casos: na VPS, um **Caddy/Traefik em Docker** trata do TLS automaticamente
(preferível ao Nginx manual). Não fiques bloqueado à espera de um domínio "oficial".

## 4. Pós-deploy (verifica de facto)
- Faz um smoke test real por HTTPS no domínio: registo/login, `/today` devolve peça,
  troca PT/EN, journaling grava. Usa `curl` e reporta os códigos de estado no log.
- Atualiza `NEXTAUTH_URL` para o domínio público e redeploy se necessário.
- Escreve `PROGRESS.md`: o que ficou no ar (URL), o que falta, e quaisquer credenciais
  que faltavam (sem as expor — só o nome da chave).

## Invioláveis
- Copy de bem-estar, nunca clínico. As 365 peças mantêm `needsReview=true`.
- Não tocar em dados/recursos de outros projetos. BD da Páginas isolada.
- Segredos fora do git (`deploy.env` e `.env` no `.gitignore`).
