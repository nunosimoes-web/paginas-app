export const PRAISE = [
  "Boa!",
  "Fantástico!",
  "Uau, que energia!",
  "És uma estrela!",
  "Espetacular!",
  "Isso mesmo!",
  "Incrível!",
  "Que ritmo!",
  "Brutal!",
  "Super!",
];

export const ENCOURAGE = [
  "Mexe esses braços!",
  "Não pares!",
  "Mais energia!",
  "Sorri enquanto danças!",
  "Vamos, vamos!",
  "Sente a música!",
];

export const FREEZE_OK = ["Perfeito, nem te mexeste!", "Estátua de pedra!", "Que estátua fantástica!", "Ninguém se mexeu!"];
export const FREEZE_FAIL = ["Ups, vi-te a mexer!", "A estátua tremeu!", "Quase! Para a próxima fica mais quietinho."];

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Frases de interface faladas pelo Bailarico (pré-geradas quando há fal.ai). */
export const UI_PHRASES = {
  welcome: "Olá! Bem-vindo ao Bailarico, a escola de dança mais divertida do mundo!",
  askName: "Como te chamas?",
  pickStyle: "Escolhe o teu estilo de dança!",
  watch: "Olha com atenção!",
  yourTurn: "Agora tu!",
  countdown: "Prepara-te!",
  lessonDone: "Lição completa! Ganhaste um autocolante novo!",
  choreo: "Agora vamos juntar tudo. A coreografia completa!",
  freezeIntro: "Quando a música parar, ficas em estátua! Vamos ver quem é a melhor estátua do mundo.",
  freeze: "Estátua!",
  dance: "Dança!",
  simonIntro: "Eu mostro os passos, tu repetes na mesma ordem. Vamos ver a tua memória de dançarino!",
  simonYourTurn: "A tua vez! Toca nos passos pela ordem certa.",
  stageIntro: "Palco livre! Dança como quiseres e enche a barra de energia!",
  stickers: "Estes são os teus autocolantes. Que coleção fantástica!",
  studioIntro: "Bem-vindo ao Estúdio Mágico! Aqui crias o teu próprio dançarino.",
};
