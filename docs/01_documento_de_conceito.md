# Documento de Conceito — App de Acompanhamento Terapêutico Diário

> **Nome de trabalho:** *Páginas* (placeholder — ver secção "Nome e identidade")
> **Versão:** 0.1 — 21 de maio de 2026
> **Autor:** Nuno Simões
> **Estado:** Conceito para validação e arranque de MVP

---

## 1. Resumo executivo

Uma aplicação de bem-estar emocional que funciona como **ponte entre a sessão de psicoterapia e o dia-a-dia**. Todos os dias entrega à pessoa um *prompt* curto — um lembrete, um exercício ou, sobretudo, uma **micro-história ou metáfora** — que reforça os princípios terapêuticos que ela está a trabalhar. O conteúdo é personalizado ao tema, ao estado emocional e ao ponto do percurso de cada pessoa.

A app serve **dois públicos em simultâneo**:

1. **Uso individual (B2C):** qualquer pessoa que queira manter-se no caminho do seu equilíbrio emocional, faça ou não terapia.
2. **Integração com terapeuta (B2B2C):** o profissional "semeia" temas após cada sessão, e a app reforça-os ao longo da semana junto do cliente.

**Posicionamento crítico:** é um produto de **bem-estar e apoio**, explicitamente **não um substituto de terapia nem um dispositivo médico**. Esta fronteira é central por razões éticas e regulatórias.

---

## 2. O problema

A psicoterapia acontece tipicamente uma vez por semana, durante ~50 minutos. As outras ~10.000 minutos da semana são onde a mudança realmente tem (ou não tem) lugar. Entre sessões, as pessoas:

- esquecem-se das ferramentas e *insights* que descobriram em sessão;
- perdem o fio ao tema que estavam a trabalhar;
- não têm um lembrete gentil que as recoloque no caminho num momento difícil;
- carecem de uma forma de praticar, de forma leve e quotidiana, aquilo que a terapia propõe.

As pessoas esquecem instruções, mas **lembram-se de histórias**. A metáfora é o veículo natural da psique para a mudança — e está subexplorada nas apps atuais.

---

## 3. Análise do mercado

| Categoria | Exemplos | O que fazem bem | Lacuna |
|---|---|---|---|
| Journaling guiado / prompts | Bloom, Stoic, Reflectly, Finch | Hábito diário, gamificação | Prompts genéricos, iguais para todos |
| Chatbots TCC | Woebot, Wysa, Sanvello | Exercícios estruturados | Pouco inspiracional, sem narrativa |
| Mindfulness / narrativa | Calm, Headspace | Provam o poder da história | Não ligados a percurso terapêutico |
| Companhia entre sessões | BetterHelp, plataformas de terapia | Ligação ao profissional | Exercícios genéricos, não narrativos |

**O espaço em aberto:** ninguém combina, em simultâneo, (a) personalização real ao percurso da pessoa, (b) a metáfora/história como formato central e (c) uma ponte verdadeira com o terapeuta. É aí que este produto vive.

---

## 4. Público-alvo

**Persona A — "A pessoa em terapia"** (núcleo). Faz terapia, valoriza-a, mas sente que o trabalho se dilui entre sessões. Quer um companheiro discreto e gentil.

**Persona B — "A pessoa em jornada de autoconhecimento"**. Não faz (ou não pode fazer) terapia, mas lê sobre o tema, segue conteúdos de psicologia e quer estrutura.

**Persona C — "O/a terapeuta"**. Quer prolongar o efeito das sessões e diferenciar a sua prática, sem trabalho administrativo pesado. É o canal de distribuição B2B2C e fonte de credibilidade.

---

## 5. Modelo de conteúdo terapêutico

O coração do produto. Estrutura proposta em três camadas:

**Camada 1 — Princípios (as "dicas e conselhos").** Mapeados a partir das grandes correntes terapêuticas:

- **TCC / TCC focada no trauma** — distorções cognitivas, reestruturação de pensamentos, exposição gradual.
- **ACT (Aceitação e Compromisso)** — desfusão cognitiva, valores, aceitação do desconforto. Riquíssima em metáforas ("o passageiro no autocarro", "as folhas no rio").
- **DBT (Dialética Comportamental)** — regulação emocional, tolerância ao mal-estar, eficácia interpessoal.
- **Mindfulness e auto-compaixão** (Kristin Neff) — tratar-se com a gentileza dada a um amigo.
- **Teoria do apego / IFS (Internal Family Systems)** — as "partes" de nós.
- **Terapia somática / teoria polivagal** — reconhecer o estado do corpo, ancoragem, regulação do sistema nervoso.
- **Psicologia narrativa** — re-escrever a história que contamos sobre nós próprios.

**Camada 2 — Temas.** Agrupam princípios em torno de experiências concretas: ansiedade, luto, fronteiras/limites, autocrítica, relações, trauma, transições de vida, raiva, solidão.

**Camada 3 — Peças de conteúdo.** A unidade entregue diariamente. Cada peça tem um *tipo*:

- **Metáfora / micro-história** (formato-âncora, ~60 segundos de leitura);
- **Lembrete** (uma frase que encarna um princípio);
- **Micro-exercício** (uma ação concreta de 2–5 min: respiração, journaling, ancoragem);
- **Pergunta de reflexão** (alimenta o journaling).

Cada peça está etiquetada por princípio, tema, tom emocional adequado e nível de "profundidade", para o motor de personalização poder escolher bem.

---

## 6. Experiência do produto (MVP)

1. **Onboarding** — a pessoa indica o que a traz (temas), se faz terapia, e em que momento do dia quer ser lembrada.
2. **Prompt diário** — uma peça de conteúdo personalizada, entregue à hora escolhida. Tom calmo, sem ruído.
3. **Check-in emocional** — registo rápido de humor (informa a personalização do dia seguinte).
4. **Journaling** — espaço para responder ao prompt ou escrever livremente. Privado por defeito.
5. **Percurso** — uma visão suave da continuidade (sem "streaks" agressivos que geram culpa — coerente com a auto-compaixão).
6. **Modo terapeuta** — o profissional cria um espaço, convida o cliente por código, e "semeia" temas/peças após cada sessão.

---

## 7. Diferenciadores

A primeira aposta é a **personalização real** ao tema, estado emocional e fase do percurso — em vez do mesmo prompt para toda a gente.

A segunda é a **metáfora/história como formato central**, não acessório. É o que torna o conteúdo memorável e emocionalmente eficaz.

A terceira é a **ponte real com o terapeuta**, que resolve a lacuna entre sessão e quotidiano e cria um motivo para os profissionais recomendarem a app.

A quarta é uma **filosofia de design gentil**: sem gamificação ansiogénica, sem culpa por falhar um dia, coerente com os próprios princípios terapêuticos que veicula.

---

## 8. Considerações éticas e regulatórias (essenciais)

- **Não é tratamento.** Comunicação clara, em onboarding e nos termos, de que a app é complemento de bem-estar e não substitui acompanhamento clínico.
- **Evitar reivindicações clínicas.** Apps que afirmam tratar/diagnosticar condições entram em território de dispositivo médico (regras da UE/MDR e equivalentes). O *copy* deve ser cuidado.
- **Gestão de crise.** Mecanismo para encaminhar para linhas de apoio (ex.: SOS Voz Amiga em Portugal, 112) caso surjam sinais de crise. Nunca fazer "avaliação de risco" automatizada.
- **Privacidade de dados sensíveis.** Conteúdo de journaling e estados emocionais são dados de saúde sob o RGPD: cifragem, minimização, consentimento explícito, direito ao apagamento. Servidores na UE.
- **Validação clínica.** O conteúdo terapêutico deve ser revisto por profissionais qualificados antes de publicação.

---

## 9. Modelo de negócio (hipótese inicial)

- **B2C:** freemium — prompt diário gratuito; subscrição desbloqueia personalização avançada, biblioteca completa de metáforas, journaling com histórico.
- **B2B2C:** licença para terapeutas/clínicas (por profissional ou por cliente ativo).
- A integração com terapeuta funciona como canal de aquisição de baixo custo e selo de credibilidade.

---

## 10. Nome e identidade

O domínio do fundador (*paginasemetaforas*) capta perfeitamente a essência: **páginas** (o diário, a continuidade) e **metáforas** (o veículo da mudança). Nomes a explorar: *Páginas*, *Metáfora*, *Entre Sessões*, *Margem*, *Âncora*. A identidade visual deve ser calma, respirável, com tipografia legível e uma paleta suave — o oposto do design "viciante".

---

## 11. Roadmap

**Hoje (MVP ponta-a-ponta):** onboarding, prompt diário personalizado (motor baseado em regras), check-in de humor, journaling, biblioteca de metáforas semente, modo terapeuta básico, bilingue PT/EN, deploy na VPS + Cloudflare. *(Ver brief de execução para o Claude Code.)*

**Semanas 1–4:** notificações/email à hora escolhida, expansão da biblioteca de conteúdo com revisão clínica, refinamento do motor de personalização, app instalável (PWA).

**Meses 2–3:** apps nativas (ou PWA polida), motor de personalização com sinais mais ricos, dashboard do terapeuta, métricas de adesão.

**Mais tarde:** personalização assistida por IA (geração de metáforas dentro de limites validados), parcerias com clínicas, validação de eficácia.

---

## 12. Riscos e mitigações

- **Risco regulatório** → linguagem de bem-estar, não-clínica; aconselhamento jurídico antes de escalar.
- **Qualidade/segurança do conteúdo** → revisão por profissionais; biblioteca curada, não gerada livremente por IA no início.
- **Adesão (as pessoas largam apps de hábito)** → design gentil, valor logo no primeiro prompt, sem fricção.
- **Privacidade** → arquitetura RGPD desde o início, dados na UE, cifragem.
