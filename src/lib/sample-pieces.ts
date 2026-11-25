// Peças mostradas na página inicial antes de criar conta. Os textos são os de
// data/content_365.json, sem alterações (sample-pieces.test.ts confirma-o).

export type SamplePiece = {
  id: string;
  theme: string;
  themeName: Record<"pt-PT" | "en", string>;
  body: Record<"pt-PT" | "en", string>;
};

export const SAMPLE_PIECES: SamplePiece[] = [
  {
    id: "pc_2ba8e9066cb9",
    theme: "anxiety",
    themeName: { "pt-PT": "Ansiedade", en: "Anxiety" },
    body: {
      "pt-PT":
        "A mente é como um céu. Os pensamentos e as emoções são nuvens — algumas escuras, algumas leves. Passam todas. O céu permanece, e tu és o céu, não a tempestade.",
      en: "The mind is like the sky. Thoughts and emotions are clouds — some dark, some light. They all pass. The sky remains, and you are the sky, not the storm.",
    },
  },
  {
    id: "pc_c5d0ac8f302c",
    theme: "self_criticism",
    themeName: { "pt-PT": "Autocrítica", en: "Self-criticism" },
    body: {
      "pt-PT":
        "Não tratas uma planta que murcha com gritos. Dás-lhe luz, água e tempo. Tu também cresces assim — com cuidado, não com castigo.",
      en: "You don't treat a wilting plant by shouting at it. You give it light, water and time. You grow the same way — with care, not punishment.",
    },
  },
  {
    id: "pc_d308b8aa843c",
    theme: "relationships",
    themeName: { "pt-PT": "Relações", en: "Relationships" },
    body: {
      "pt-PT":
        "A atenção é como uma lanterna num quarto escuro: aquilo para onde a apontas é o que vês. Hoje, escolhe com cuidado para onde apontas a tua.",
      en: "Attention is like a flashlight in a dark room: whatever you point it at is what you see. Today, choose carefully where you aim yours.",
    },
  },
  {
    id: "pc_5014db9fdd96",
    theme: "boundaries",
    themeName: { "pt-PT": "Fronteiras", en: "Boundaries" },
    body: {
      "pt-PT":
        "Os limites não são muros para afastar as pessoas. São portas com fechadura: tu decides quem entra e quando. Ter chave da tua própria porta não é egoísmo — é cuidado.",
      en: "Boundaries aren't walls to keep people out. They are doors with locks: you decide who enters and when. Holding the key to your own door isn't selfishness — it's care.",
    },
  },
];

/** Tema escolhido na página inicial; fica só neste separador do navegador. */
export const SAMPLE_THEME_KEY = "mw:tema";
