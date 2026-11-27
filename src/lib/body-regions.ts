// Zonas do mapa corporal (SomaSignal). Lado grátis: a leitura é curta,
// exploratória e tem SEMPRE um passo de segurança médica antes de qualquer
// causa emocional. Sem diagnóstico, sem promessa.
//
// As palavras aqui foram escolhidas para serem calmas, curtas e humanas.
// O Nuno deve rever o texto antes de qualquer publicação pública.

export type RegionId =
  | "head"
  | "jaw"
  | "neck"
  | "chest"
  | "shoulders"
  | "back"
  | "stomach"
  | "hands"
  | "pelvis"
  | "hips"
  | "knees"
  | "feet";

export type Region = {
  id: RegionId;
  labelPT: string;
  labelEN: string;
  x: number;
  y: number;
  insightPT: string;
  insightEN: string;
  causesPT: string[];
  causesEN: string[];
  // Micro-intervenção única (grátis). O Plus abre o diário e o relatório.
  solutionPT: string;
  solutionEN: string;
};

export const REGIONS: Region[] = [
  {
    id: "head",
    labelPT: "Cabeça",
    labelEN: "Head",
    x: 50,
    y: 10,
    insightPT: "sobrecarga mental, pouco descanso ou preocupação persistente",
    insightEN: "mental overload, poor rest or lingering worry",
    causesPT: ["sono irregular", "ruminação", "pressão de desempenho"],
    causesEN: ["irregular sleep", "rumination", "performance pressure"],
    solutionPT: "beber água e descansar dez minutos sem ecrãs",
    solutionEN: "drink water and rest for ten minutes away from screens",
  },
  {
    id: "jaw",
    labelPT: "Maxilar",
    labelEN: "Jaw",
    x: 50,
    y: 18,
    insightPT: "tensão acumulada ou dentes a apertar sem notar",
    insightEN: "stored tension or clenched teeth you may not notice",
    causesPT: ["stress noturno", "raiva contida", "foco prolongado"],
    causesEN: ["night stress", "unspoken anger", "long focus sessions"],
    solutionPT: "relaxar a língua e massajar o maxilar devagar",
    solutionEN: "relax the tongue and gently massage the jaw",
  },
  {
    id: "neck",
    labelPT: "Pescoço",
    labelEN: "Neck",
    x: 50,
    y: 23,
    insightPT: "rigidez, alerta constante ou excesso de carga mental",
    insightEN: "stiffness, constant alert or mental overload",
    causesPT: ["postura", "hipervigilância", "muitas horas ao ecrã"],
    causesEN: ["posture", "hypervigilance", "long screen time"],
    solutionPT: "baixar os ombros ao expirar e rodar o pescoço devagar",
    solutionEN: "drop the shoulders on exhale and slowly rotate the neck",
  },
  {
    id: "shoulders",
    labelPT: "Ombros",
    labelEN: "Shoulders",
    x: 50,
    y: 27,
    insightPT: "responsabilidade acumulada ou sensação de carregar demasiado",
    insightEN: "stored responsibility or the feeling of carrying too much",
    causesPT: ["trabalho", "perfeccionismo", "postura defensiva"],
    causesEN: ["work", "perfectionism", "defensive posture"],
    solutionPT: "baixar os ombros cinco vezes, lentamente, com as costas apoiadas",
    solutionEN: "drop the shoulders five times, slowly, with your back supported",
  },
  {
    id: "chest",
    labelPT: "Peito",
    labelEN: "Chest",
    x: 50,
    y: 32,
    insightPT: "alarme do corpo ou necessidade de segurança. Dor ou aperto no peito pede sempre avaliação médica primeiro; em emergência, liga 112",
    insightEN: "the body's alarm or a need for safety. Chest pain or tightness always calls for a medical check first; in an emergency, call 112",
    causesPT: ["ansiedade", "luto", "sobrecarga emocional"],
    causesEN: ["anxiety", "grief", "emotional overload"],
    solutionPT: "expirar mais devagar do que inspiras, durante dois minutos",
    solutionEN: "exhale more slowly than you inhale, for two minutes",
  },
  {
    id: "stomach",
    labelPT: "Estômago",
    labelEN: "Stomach",
    x: 50,
    y: 45,
    insightPT: "antecipação, ansiedade social ou dificuldade em processar algo",
    insightEN: "anticipation, social anxiety or trouble digesting something",
    causesPT: ["reuniões", "conflito", "alimentação irregular"],
    causesEN: ["meetings", "conflict", "irregular meals"],
    solutionPT: "colocar a mão aberta na barriga e respirar devagar",
    solutionEN: "place an open hand on the belly and breathe slowly",
  },
  {
    id: "back",
    labelPT: "Costas",
    labelEN: "Back",
    x: 50,
    y: 41,
    insightPT: "falta de suporte, tensão muscular ou peso emocional",
    insightEN: "lack of support, muscle tension or emotional weight",
    causesPT: ["sentir-se sozinho", "pressão financeira", "muitas horas sentado"],
    causesEN: ["loneliness", "money pressure", "long hours sitting"],
    solutionPT: "caminhar cinco minutos num ritmo calmo",
    solutionEN: "walk for five minutes at a calm pace",
  },
  {
    id: "hands",
    labelPT: "Mãos",
    labelEN: "Hands",
    x: 29,
    y: 57,
    insightPT: "controlo, produtividade ou dificuldade em largar algo",
    insightEN: "control, productivity or difficulty letting go",
    causesPT: ["sobrecarga digital", "tensão de controlo", "medo de parar"],
    causesEN: ["digital overload", "control tension", "fear of stopping"],
    solutionPT: "aquecer as mãos esfregando as palmas e fechar e abrir os dedos",
    solutionEN: "warm your hands by rubbing the palms and open and close the fingers",
  },
  {
    id: "pelvis",
    labelPT: "Pelve",
    labelEN: "Pelvis",
    x: 50,
    y: 61,
    insightPT: "limites, segurança, intimidade ou contração defensiva",
    insightEN: "boundaries, safety, intimacy or defensive contraction",
    causesPT: ["medo de exposição", "pressão relacional", "historial de dor"],
    causesEN: ["fear of exposure", "relational pressure", "history of pain"],
    solutionPT: "movimento suave e consciente da zona, sem forçar",
    solutionEN: "gentle, aware movement in the area, without forcing",
  },
  {
    id: "hips",
    labelPT: "Ancas",
    labelEN: "Hips",
    x: 62,
    y: 66,
    insightPT: "transição, estabilidade ou medo de avançar",
    insightEN: "transition, stability or fear of moving forward",
    causesPT: ["sedentarismo", "decisões adiadas", "mudanças recentes"],
    causesEN: ["sedentary routine", "postponed decisions", "recent changes"],
    solutionPT: "balançar as ancas devagar, de pé, durante um minuto",
    solutionEN: "gently sway the hips while standing, for one minute",
  },
  {
    id: "knees",
    labelPT: "Joelhos",
    labelEN: "Knees",
    x: 40,
    y: 78,
    insightPT: "suporte, direção ou pressão para continuar sem pausa",
    insightEN: "support, direction or pressure to keep going without pause",
    causesPT: ["sobrecarga mecânica", "medo de ceder", "falta de apoio"],
    causesEN: ["mechanical overload", "fear of giving in", "lack of support"],
    solutionPT: "sentar-se e apoiar os pés; se houver inchaço, calor ou dor forte, falar com um profissional de saúde",
    solutionEN: "sit and rest the feet; if there is swelling, heat or strong pain, talk to a health professional",
  },
  {
    id: "feet",
    labelPT: "Pés",
    labelEN: "Feet",
    x: 61,
    y: 96,
    insightPT: "base, aterramento ou cansaço de sustentar tudo",
    insightEN: "ground, rooting or the fatigue of holding everything up",
    causesPT: ["fadiga acumulada", "pouco descanso", "muito tempo de pé"],
    causesEN: ["accumulated fatigue", "poor rest", "long time standing"],
    solutionPT: "sentir a planta dos pés em contacto com o chão por um minuto",
    solutionEN: "feel the soles of your feet touching the floor for a minute",
  },
];

export function pickRegion(id: RegionId): Region {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}
