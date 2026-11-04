# 💃 Bailarico

**A escola de dança mais divertida do mundo, para crianças dos 6 aos 10 anos.**
Aberta a todos: sem registo, sem anúncios, sem recolha de dados.

| Versão | URL | Notas |
|---|---|---|
| **v2 (atual)** | https://dance.playlabacademy.com | Multilingue (pt-PT por omissão, inglês), voz portuguesa de Portugal, mascotes e passos em vídeo 3D gerados por IA. |
| v1 (congelada) | https://bailarico.playlabacademy.com | Primeira versão, mantida à parte sem alterações (app Coolify fixada no commit `19fb3d8`). |

## Línguas

Todo o texto e todas as frases faladas vivem em `shared/i18n/<língua>.ts` (`pt-PT`, `en`). Acrescentar uma língua =
copiar `en.ts`, traduzir, registar em `shared/i18n/index.ts` e escolher um fornecedor de voz em `server/config.ts`.
A língua é escolhida por `?lang=`, pela preferência guardada ou pelo browser; há um botão de bandeira no topo.

### Voz: porquê Gemini para pt-PT
Todos os modelos de voz do fal.ai (ElevenLabs, MiniMax, Chatterbox) e todos os modelos de música com letra
produziram **sotaque brasileiro** em português, confirmado por avaliação fonética automática (Gemini 3.1 Pro a
transcrever e classificar amostras, com controlo brasileiro). O único que passou foi o **Gemini TTS** com
`languageCode: "pt-PT"` (voz *Leda*): texto puro, sem instruções no prompt, para não as ler em voz alta.
Por isso a voz pt-PT usa `GEMINI_API_KEY`; o inglês usa ElevenLabs via fal.ai; imagens, vídeos e música ficam no fal.ai.
As "músicas com o meu nome" são instrumentais (Lyria 2) dedicadas pela voz do Bailarico, em vez de cantadas em pt-BR.

## O que tem

| Área | O que a criança faz |
|---|---|
| **Aprender a dançar** | 5 estilos (Dança do Robô, Hipo-Hop, Ballet Mágico, Festa Tropical, Disco Dino), cada um com um mascote-professor, 3 lições e 20 passos no total. Fluxo: o mascote demonstra → "Agora tu!" → coreografia completa → estrelas e autocolante. |
| **Estátua!** | Dança enquanto há música; quando para, ninguém se mexe. 3 corações, 10 rondas para ser campeão. |
| **Segue o Mestre** | Jogo de memória com passos de dança: vê a sequência, repete pela ordem certa, sobe de nível. |
| **Palco Livre** | Dança livre com música e luzes; a barra de energia enche com o movimento. |
| **Autocolantes** | Coleção de 15 prémios, estrelas e energia acumulada. |
| **Estúdio Mágico** (fal.ai) | Atrás de um portão para adultos: cria um dançarino a partir de uma descrição (imagem), dá-lhe vida (vídeo de 5 s) e compõe uma música com o nome da criança. |

### Movimento real (opcional)
Com a câmara ligada, a app mede quanto a criança se mexe comparando frames (sem bibliotecas, sem
rede: a imagem nunca sai do aparelho). Sem câmara, há um grande botão "Bate o ritmo!".

### Mascotes e passos em vídeo
Os cinco professores são renders em estilo de filme de animação 3D (Nano Banana 2) e **cada passo de cada estilo tem um
clip de 5 s** do mascote a executá-lo (Kling v3, imagem→vídeo a partir do render, para manter a personagem), mais um
clip de boas-vindas por mascote: 45 clips. As lições, a Estátua, o Segue o Mestre e o Palco Livre usam estes vídeos;
o dançarino SVG animado fica apenas como recurso quando um clip não existe.

### Música e voz
- **Sempre:** bateria + baixo + acordes sintetizados em WebAudio, com padrão e BPM por estilo (incluindo valsa em 3 tempos para o ballet); voz do browser só se existir uma voz exatamente da língua certa (nunca pt-BR para pt-PT).
- **Com chaves:** voz Gemini (pt-PT) / ElevenLabs (en), músicas instrumentais por estilo (Lyria 2). Tudo em cache no servidor; cada pedido único só é feito uma vez.

## Correr localmente

```bash
cd bailarico
npm install
cp .env.example .env        # opcional: põe a FAL_KEY
npm run dev                  # web em http://localhost:5173, API em :3000
```

Produção:

```bash
npm run build && npm start   # serve app + API em :3000
```

## fal.ai

- `FAL_KEY` liga o Estúdio Mágico, os clips, as mascotes, a música e a voz inglesa. `GEMINI_API_KEY` liga a voz pt-PT. Sem chaves a app continua 100% funcional em modo offline.
- Modelos e limites diários configuráveis em `.env.example` (`AI_*_MODEL`, `AI_MAX_*_PER_DAY`).
- Segurança para crianças: as descrições são curtas, passam por uma lista de bloqueio (violência, medo, conteúdo adulto, marcas, pessoas reais) e são sempre embrulhadas num prompt de estilo infantil; os safety checkers dos modelos ficam ligados.

### Pré-gerar os recursos (vozes, mascotes, músicas)

```bash
npm run generate-assets -- [--no-clips] [--locales=pt-PT,en]
```

ou, com o servidor em produção e `ADMIN_KEY` definida:

```bash
curl -X POST "https://dance.playlabacademy.com/api/admin/generate?key=ADMIN_KEY"
curl "https://dance.playlabacademy.com/api/admin/generate/status?key=ADMIN_KEY"
```

Parâmetros opcionais: `images=0`, `clips=0`, `music=0`, `voice=0`, `locales=pt-PT,en`. A geração é idempotente e
retomável; os 45 clips demoram cerca de 40 minutos. Mudar `ART_VERSION` em `shared/catalog.ts` regenera mascotes e clips.

O resultado fica em `$CACHE_DIR/generated/manifest.json` e a app passa a usá-lo automaticamente.

## Deploy (Coolify + Cloudflare)

- Aplicação Coolify a partir deste repositório com **Base Directory `/bailarico`** e build pack Dockerfile.
- Variáveis: `FAL_KEY`, `GEMINI_API_KEY`, `ADMIN_KEY`, `CACHE_DIR=/app/cache`; volume persistente (tipo `persistent`) em `/app/cache`.
- DNS: `dance.playlabacademy.com` → IP do servidor Coolify (Cloudflare proxied, SSL Full); TLS Let's Encrypt automático.

## Estrutura

```
bailarico/
├─ shared/      catálogo neutro (estilos, passos, lições, prompts de IA) + i18n/<língua>.ts, usados por browser e servidor
├─ src/         app React (ecrãs, componentes, motor de ritmo, voz, câmara, progresso)
├─ server/      Express: /api/ai/* (proxy fal.ai com cache e limites), /media, /generated, SPA
├─ scripts/     generate-assets (pré-geração com fal.ai)
└─ Dockerfile
```
