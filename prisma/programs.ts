// Fica em prisma/ (e não em src/) porque a imagem Docker de execução só copia
// prisma/ e data/ para correr o seed no arranque.
// Percursos de 21 dias (Plus). Cada percurso usa as N primeiras peças de um
// tema, por ordem do dia do calendário. As peças vêm do conteúdo existente
// (data/content_365.json): os percursos não trazem texto novo nas peças, só o
// título e o resumo. Linguagem de bem-estar: sem promessas de resultado nem
// de tratamento.
//
// Temas deixados de fora de propósito: "grief" (luto) e "trauma" (só 11 peças).
// São temas sensíveis e pedem revisão clínica antes de virarem percurso.

export type ProgramDef = {
  slug: string;
  titleI18n: Record<"pt-PT" | "en", string>;
  summaryI18n: Record<"pt-PT" | "en", string>;
  days: number;
  themeFilter: string;
};

export const PROGRAMS: ProgramDef[] = [
  {
    slug: "anxiety-21",
    titleI18n: {
      "pt-PT": "Ansiedade — 21 dias",
      en: "Anxiety — 21 days",
    },
    summaryI18n: {
      "pt-PT":
        "Vinte e um dias com peças calmas para estares com a ansiedade sem forçar nada, um dia de cada vez.",
      en:
        "Twenty-one days of calm pieces for being with anxiety without forcing anything, one day at a time.",
    },
    days: 21,
    themeFilter: "anxiety",
  },
  {
    slug: "self-criticism-21",
    titleI18n: {
      "pt-PT": "Autocrítica — 21 dias",
      en: "Self-criticism — 21 days",
    },
    summaryI18n: {
      "pt-PT":
        "Vinte e um dias para reparar na voz que exige demais e experimentar, aos poucos, falar contigo com a gentileza que darias a quem gostas.",
      en:
        "Twenty-one days to notice the voice that demands too much and to try, little by little, speaking to yourself with the kindness you'd give someone you care about.",
    },
    days: 21,
    themeFilter: "self_criticism",
  },
  {
    slug: "transitions-21",
    titleI18n: {
      "pt-PT": "Transições — 21 dias",
      en: "Transitions — 21 days",
    },
    summaryI18n: {
      "pt-PT":
        "Vinte e um dias para atravessar uma fase de mudança um passo de cada vez, com perguntas sobre o que importa para ti e sem teres de ter tudo decidido.",
      en:
        "Twenty-one days to move through a time of change one step at a time, with questions about what matters to you and no need to have it all figured out.",
    },
    days: 21,
    themeFilter: "transitions",
  },
  {
    slug: "loneliness-21",
    titleI18n: {
      "pt-PT": "Solidão — 21 dias",
      en: "Loneliness — 21 days",
    },
    summaryI18n: {
      "pt-PT":
        "Vinte e um dias para olhar a solidão de outra forma: ser companhia para ti e dar pequenos passos na direção das pessoas.",
      en:
        "Twenty-one days to look at loneliness differently: being company for yourself and taking small steps towards other people.",
    },
    days: 21,
    themeFilter: "loneliness",
  },
  {
    slug: "boundaries-21",
    titleI18n: {
      "pt-PT": "Fronteiras — 21 dias",
      en: "Boundaries — 21 days",
    },
    summaryI18n: {
      "pt-PT":
        "Vinte e um dias para perceber onde gastas energia que querias guardar e praticar, sem culpa, um «não» pequeno de cada vez.",
      en:
        "Twenty-one days to notice where you spend energy you'd rather keep, and to practise, without guilt, one small 'no' at a time.",
    },
    days: 21,
    themeFilter: "boundaries",
  },
];

type PieceLike = { id: string; theme: string; day: number };

/** Sequência diária de um percurso: N primeiras peças do tema, por dia ascendente. */
export function programPieceOrder(pieces: PieceLike[], def: Pick<ProgramDef, "themeFilter" | "days">): string[] {
  return pieces
    .filter((p) => p.theme === def.themeFilter)
    .sort((a, b) => a.day - b.day)
    .slice(0, def.days)
    .map((p) => p.id);
}
