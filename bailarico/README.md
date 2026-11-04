# 💃 Bailarico

**A escola de dança mais divertida do mundo, para crianças dos 6 aos 10 anos.**
Aberta a todos: sem registo, sem anúncios, sem recolha de dados. Em português de Portugal.

Produção: https://bailarico.playlabacademy.com

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

### Música e voz
- **Sempre:** bateria + baixo + acordes sintetizados em WebAudio, com padrão e BPM por estilo (incluindo valsa em 3 tempos para o ballet), e voz do browser em pt-PT.
- **Com fal.ai:** vozes ElevenLabs (pt), mascotes ilustrados (Nano Banana 2), vídeos dos mascotes a dançar (Kling v3), músicas por estilo (Lyria 2) e canções personalizadas com letra (MiniMax Music 2.6). Tudo é guardado em cache no servidor; o fal só é chamado uma vez por cada pedido único.

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

- `FAL_KEY` liga o Estúdio Mágico e o TTS. Sem chave a app continua 100% funcional em modo offline.
- Modelos e limites diários configuráveis em `.env.example` (`AI_*_MODEL`, `AI_MAX_*_PER_DAY`).
- Segurança para crianças: as descrições são curtas, passam por uma lista de bloqueio (violência, medo, conteúdo adulto, marcas, pessoas reais) e são sempre embrulhadas num prompt de estilo infantil; os safety checkers dos modelos ficam ligados.

### Pré-gerar os recursos (vozes, mascotes, músicas)

```bash
npm run generate-assets -- [--videos]
```

ou, com o servidor em produção e `ADMIN_KEY` definida:

```bash
curl -X POST "https://bailarico.playlabacademy.com/api/admin/generate?key=ADMIN_KEY&videos=1"
curl "https://bailarico.playlabacademy.com/api/admin/generate/status?key=ADMIN_KEY"
```

O resultado fica em `$CACHE_DIR/generated/manifest.json` e a app passa a usá-lo automaticamente.

## Deploy (Coolify + Cloudflare)

- Aplicação Coolify a partir deste repositório com **Base Directory `/bailarico`** e build pack Dockerfile.
- Variáveis: `FAL_KEY`, `ADMIN_KEY`, `CACHE_DIR=/app/cache` (volume persistente em `/app/cache`).
- DNS: `bailarico.playlabacademy.com` → IP do servidor Coolify; TLS Let's Encrypt automático.

## Estrutura

```
bailarico/
├─ shared/      tipos + dados (estilos, passos, lições, frases) usados por browser e servidor
├─ src/         app React (ecrãs, componentes, motor de ritmo, voz, câmara, progresso)
├─ server/      Express: /api/ai/* (proxy fal.ai com cache e limites), /media, /generated, SPA
├─ scripts/     generate-assets (pré-geração com fal.ai)
└─ Dockerfile
```
