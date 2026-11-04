import type { Locale, StyleId } from "../types.js";

/** Forma de um dicionário de língua. Todo o texto visível/falado da app vem daqui. */
export interface Dict {
  code: Locale;
  name: string;
  flag: string;
  /** BCP-47 usado para a voz do browser (fallback) */
  speechLang: string;
  styles: Record<StyleId, { name: string; tagline: string; mascotName: string; greeting: string }>;
  moves: Record<string, { name: string; instruction: string; tip: string; howTo: string }>;
  lessons: Record<string, { title: string; sticker: string }>;
  praise: string[];
  encourage: string[];
  freezeOk: string[];
  freezeFail: string[];
  ui: UiStrings;
}

export interface UiStrings {
  appName: string;
  tagline: string;
  tapToStart: string;
  askName: string;
  askNameSub: string;
  namePlaceholder: string;
  pickSymbol: string;
  letsDance: string;
  hello: string; // "Olá, {name}!"
  whatToday: string;
  learnTitle: string;
  learnDesc: string;
  freezeTitle: string;
  freezeDesc: string;
  simonTitle: string;
  simonDesc: string;
  stageTitle: string;
  stageDesc: string;
  stickersTitle: string;
  stickersDesc: string;
  studioTitle: string;
  studioDesc: string;
  aiOn: string;
  withAdult: string;
  record: string;
  level: string;
  homeTip: string;
  footer: string;
  voiceOn: string;
  voiceOff: string;
  back: string;
  language: string;
  chooseStyle: string;
  eachStyle: string;
  stepOf: string; // "Passo {n} de {total}"
  watch: string;
  yourTurn: string;
  choreo: string;
  start: string;
  cameraOn: string;
  cameraOff: string;
  cameraDenied: string;
  cameraOptional: string;
  beatButton: string;
  lessonDone: string;
  stickerLabel: string;
  inCollection: string; // "{n} de {total} na coleção"
  repeat: string;
  nextLesson: string;
  todayLearn: string; // "Hoje vamos aprender {n} passos: {list}. ..."
  energy: string;
  freezeIntro: string;
  freezeRules: string;
  music: string;
  play: string;
  round: string;
  dance: string;
  freeze: string;
  dontTouch: string;
  notAFinger: string;
  champion: string;
  held: string; // "Boa! Aguentaste {n} rondas."
  again: string;
  home: string;
  camFreezeInfo: string;
  noCamFreezeInfo: string;
  simonIntro: string;
  simonRules: string;
  steps: string;
  look: string;
  good: string;
  almost: string;
  almostWas: string; // "Quase! Era {name}. Vê outra vez."
  exit: string;
  stageIntro: string;
  stageSub: string;
  playMusic: string;
  mySongs: string;
  fillBar: string;
  goal: string;
  stop: string;
  barFull: string;
  collection: string;
  collectionSub: string; // "{s} de {t} autocolantes · ⭐ {stars} estrelas · ⚡ {energy} energia"
  undiscovered: string;
  restart: string;
  restartConfirm: string;
  studioHeading: string;
  waking: string;
  sleeping: string;
  sleepingText: string;
  gateTitle: string;
  gateText: string;
  gateWrong: string;
  tabDancer: string;
  tabSong: string;
  dancerPrompt: string;
  dancerPlaceholder: string;
  create: string;
  creationsToday: string;
  painting: string;
  giveLife: string;
  givingLife: string;
  videosToday: string;
  dancerHere: string;
  songPrompt: string; // "Vamos fazer uma música só para ti, {name}! Escolhe o estilo:"
  composeSong: string;
  composing: string;
  songHere: string;
  danceWithSong: string;
  songTitle: string; // "{style} para {name}"
  dedication: string; // "Esta música é para {name}! Um, dois, três, quatro!"
  songNote: string;
  ideas: string[];
  // contagem e treino
  counts: string[]; // "Um!", "Dois!", "Três!", "Quatro!"
  onBeat: string;
  nearBeat: string;
  offBeat: string;
  rhythmScore: string; // "Ritmo {pct}%"
  movementScore: string; // "Movimento {pct}%"
  howItWorksTitle: string;
  howItWorks1: string;
  howItWorks2: string;
  howItWorks3: string;
  modeTitle: string;
  modeCamera: string;
  modeCameraDesc: string;
  modeDrum: string;
  modeDrumDesc: string;
  modeFree: string;
  modeFreeDesc: string;
  drumHint: string;
  cameraHint: string;
  freeHint: string;
  starsCamera: string;
  starsDrum: string;
  starsFree: string;
  noWrongMoves: string;
  demoLabel: string; // "A {name} mostra"
  lessonIntroVoice: string;
  demoVoice: string; // "Olha para a {name}. Primeiro vê, depois é a tua vez."
  choreoReadyVoice: string;
  goodRhythmVoice: string;
  keepTryingVoice: string;
  bigMovesVoice: string;
  // frases faladas
  welcome: string;
  welcomeBack: string; // "Olá, {name}! ..."
  pickStyleVoice: string;
  lessonDoneVoice: string; // "... Ganhaste {stars}!"
  lessonDone1: string;
  lessonDone2: string;
  lessonDone3: string;
  oneStar: string;
  nStars: string; // "{n} estrelas"
  freezeIntroVoice: string;
  simonIntroVoice: string;
  simonYourTurnVoice: string;
  stageIntroVoice: string;
  stickersVoice: string;
  studioIntroVoice: string;
  championVoice: string;
  heldVoice: string; // "Boa! Aguentaste {n} rondas. Queres tentar outra vez?"
  levelUpVoice: string; // "{praise} Nível {n}!"
  createdVoice: string; // "Uau! Aqui está {desc}! Queres dar-lhe vida?"
  filmingVoice: string;
  aliveVoice: string;
  composingVoice: string; // "A banda está a preparar uma música {style} para {name}!"
}

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
