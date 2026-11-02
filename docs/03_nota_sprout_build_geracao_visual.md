# Nota para a sessão *Sprout Build* — Geração visual gratuita (NVIDIA NIM)

> **Origem:** revisão de um Reel do Instagram ("NVIDIA Just Made AI Subscriptions
> Obsolete", conta *thevibefounder*) feita em sessão. Filtrado o hype, ficou uma
> pista que **pode ser útil para algumas funcionalidades** da Páginas.
> **Data:** 2026-06-17 · **Estado:** ideia para avaliação (não decidido)

---

## 1. O que é, sem o hype

A NVIDIA disponibiliza um catálogo gratuito de modelos de IA via API
([build.nvidia.com](https://build.nvidia.com), projeto **NVIDIA NIM**):

- **Chave de API grátis** em ~2 min, sem cartão de crédito.
- **Endpoint único** compatível com a API da OpenAI
  (`https://integrate.api.nvidia.com/v1`) — encaixa em ferramentas que já usamos.
- **80–100+ modelos** (texto, imagem, vídeo técnico, voz, embeddings…).

O reel exagera ("torna as subscrições obsoletas"): **é uma API para developers
com limites de uso**, não um substituto de produtos como ChatGPT/Claude. Mas a
parte de **geração de imagem** é genuinamente interessante para nós.

## 2. O que serve — e o que NÃO serve — para a Páginas

| Necessidade | NVIDIA NIM serve? | Notas |
|---|---|---|
| **Imagens** para ilustrar a peça diária (metáforas, ambientes de calma) | ✅ Sim | Modelos **FLUX.1 / FLUX.2** e **Stable Diffusion 3.5 Large**; qualidade alta, ~1 MP |
| **Vídeo criativo** (Reels, anúncios) | ❌ Não | O modelo de vídeo da NVIDIA (**Cosmos**) é para *Physical AI* (robótica/simulação), **não** é alternativa a Sora/Runway/Veo |
| Geração de texto das peças | ⚠️ Possível mas não prioritário | Já temos as 365 peças; o foco editorial é humano/curado |

**Quantidade/qualidade (imagem):** qualidade comparável a Midjourney/DALL·E em
muitos casos. Limite do tier gratuito ~**40 pedidos/minuto** + créditos — dá para
**dezenas a centenas de imagens/dia** (testes, lotes pequenos). Não serve para
geração industrial de milhares sem passar a pago.

## 3. Onde poderia encaixar (a explorar com os estagiários)

1. **Ilustração das peças diárias** — gerar uma imagem de apoio (tom calmo,
   nunca clínico) coerente com a metáfora/tema do dia.
2. **Banco de imagens temático** — pré-gerar um conjunto curado por tema
   (Ansiedade, etc.) em lote, em vez de geração em tempo real por utilizador.
3. **Materiais da landing/email** — ilustração de marca sem stock pago.

## 4. Avisos e invioláveis a respeitar

- **Tom:** imagens de bem-estar, **nunca clínicas nem alarmantes** — alinhar com
  o copy. Curadoria humana antes de publicar (à semelhança de `needsReview`).
- **Licenciamento:** confirmar termos de uso comercial de cada modelo
  (FLUX vs. Stable Diffusion 3.5 têm licenças próprias) antes de usar em produção.
- **Limites:** o tier gratuito tem rate limit; **pré-gerar em lote** é mais
  seguro do que depender da API em tempo real no pedido do utilizador.
- **Segredos:** a chave `nvapi-...` fora do git (`.env`), como os restantes.
- **Privacidade:** não enviar dados pessoais/sensíveis de utilizadores nos prompts.

## 5. Próximo passo sugerido

Spike curto: gerar 5–10 imagens de teste com FLUX para um tema (ex.: Ansiedade),
avaliar adequação de tom e qualidade, e só depois decidir se vale integrar.
