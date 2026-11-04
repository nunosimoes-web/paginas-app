import type { StyleId } from "./types.js";

/** Animações disponíveis no componente Dancer (ver styles.css, [data-move]). */
export type MoveAnim =
  | "idle"
  | "palmas"
  | "bracos-ar"
  | "passo-lado"
  | "robo"
  | "robo-cabeca"
  | "giro"
  | "salto"
  | "anca"
  | "onda"
  | "chuto"
  | "estatua"
  | "plie"
  | "pontas"
  | "braco-bailarina"
  | "moonwalk"
  | "apontar"
  | "bounce"
  | "ombros"
  | "samba-pes"
  | "marcha";

export interface Move {
  id: string;
  name: string;
  emoji: string;
  anim: MoveAnim;
  /** Instrução curta, falada em voz alta e mostrada em letras grandes. */
  instruction: string;
  /** Dica engraçada para ajudar a lembrar. */
  tip: string;
  /** Número de tempos (beats) que o movimento ocupa. */
  beats: number;
  styles: StyleId[];
}

export const MOVES: Move[] = [
  {
    id: "bounce",
    name: "Bounce",
    emoji: "🏀",
    anim: "bounce",
    instruction: "Dobra um bocadinho os joelhos e salta devagarinho ao ritmo.",
    tip: "Finge que és uma bola de basquetebol!",
    beats: 4,
    styles: ["hiphop", "disco", "festa"],
  },
  {
    id: "palmas",
    name: "Palmas Altas",
    emoji: "👏",
    anim: "palmas",
    instruction: "Bate palmas por cima da cabeça nos tempos 2 e 4.",
    tip: "Palmas tão altas que quase tocas no teto!",
    beats: 4,
    styles: ["disco", "festa", "hiphop"],
  },
  {
    id: "bracos-ar",
    name: "Braços ao Ar",
    emoji: "🙌",
    anim: "bracos-ar",
    instruction: "Levanta um braço, depois o outro, como se apanhasses estrelas.",
    tip: "Apanha uma estrela com cada mão!",
    beats: 4,
    styles: ["disco", "festa", "hiphop", "ballet"],
  },
  {
    id: "passo-lado",
    name: "Passo ao Lado",
    emoji: "👟",
    anim: "passo-lado",
    instruction: "Um passo para a direita, junta os pés. Um passo para a esquerda, junta os pés.",
    tip: "Direita, junta. Esquerda, junta. Como um caranguejo!",
    beats: 4,
    styles: ["hiphop", "disco", "festa", "robo"],
  },
  {
    id: "robo-bracos",
    name: "Braços de Robô",
    emoji: "🦾",
    anim: "robo",
    instruction: "Mexe os braços em ângulos retos, um movimento de cada vez. Bip. Bop.",
    tip: "Parece que tens pilhas em vez de músculos!",
    beats: 4,
    styles: ["robo"],
  },
  {
    id: "robo-cabeca",
    name: "Cabeça Mecânica",
    emoji: "🔩",
    anim: "robo-cabeca",
    instruction: "Vira a cabeça para um lado... e para o outro... com paragens secas.",
    tip: "Tic. Tac. Tic. Tac. Como um relógio!",
    beats: 4,
    styles: ["robo"],
  },
  {
    id: "marcha",
    name: "Marcha Robótica",
    emoji: "🤖",
    anim: "marcha",
    instruction: "Marcha no lugar com os joelhos bem altos e as pernas duras.",
    tip: "Pés de ferro, joelhos de madeira!",
    beats: 4,
    styles: ["robo"],
  },
  {
    id: "onda",
    name: "A Onda",
    emoji: "🌊",
    anim: "onda",
    instruction: "Faz uma onda de um braço até ao outro, passando pelos ombros.",
    tip: "Imagina uma bolinha a rolar pelos teus braços!",
    beats: 4,
    styles: ["hiphop", "robo"],
  },
  {
    id: "ombros",
    name: "Ombros Cool",
    emoji: "😎",
    anim: "ombros",
    instruction: "Sobe e desce os ombros, primeiro um, depois o outro.",
    tip: "Ombro direito, ombro esquerdo, atitude!",
    beats: 4,
    styles: ["hiphop"],
  },
  {
    id: "giro",
    name: "Giro Giro",
    emoji: "🌀",
    anim: "giro",
    instruction: "Dá uma volta completa no lugar em quatro passos pequenos.",
    tip: "Gira como um pião, mas devagarinho para não cair!",
    beats: 4,
    styles: ["ballet", "disco", "festa"],
  },
  {
    id: "salto",
    name: "Salto Estrela",
    emoji: "⭐",
    anim: "salto",
    instruction: "Salta e abre braços e pernas como uma estrela. Depois fecha!",
    tip: "Abre, fecha, abre, fecha. Estrela a piscar!",
    beats: 4,
    styles: ["disco", "festa", "hiphop"],
  },
  {
    id: "anca",
    name: "Anca Maluca",
    emoji: "🍑",
    anim: "anca",
    instruction: "Mexe a anca de um lado para o outro ao ritmo da música.",
    tip: "Finge que tens um arco gigante à volta da cintura!",
    beats: 4,
    styles: ["festa", "disco"],
  },
  {
    id: "samba-pes",
    name: "Pezinhos de Samba",
    emoji: "🪘",
    anim: "samba-pes",
    instruction: "Pés rápidos: frente, trás, frente, trás. Pequeninos e leves.",
    tip: "Pés tão rápidos que mal tocam no chão!",
    beats: 4,
    styles: ["festa"],
  },
  {
    id: "chuto",
    name: "Chuto ao Ar",
    emoji: "🦵",
    anim: "chuto",
    instruction: "Chuta uma perna para a frente, depois a outra. Chuta, chuta!",
    tip: "Chuta a bola imaginária até à lua!",
    beats: 4,
    styles: ["festa", "disco"],
  },
  {
    id: "plie",
    name: "Plié",
    emoji: "🧸",
    anim: "plie",
    instruction: "Dobra os joelhos para fora com as costas direitas... e volta a subir.",
    tip: "Plié quer dizer dobrar, em francês! Dobra como um sanfona.",
    beats: 3,
    styles: ["ballet"],
  },
  {
    id: "pontas",
    name: "Nas Pontas",
    emoji: "🩰",
    anim: "pontas",
    instruction: "Sobe nas pontas dos pés, cresce, cresce... e desce devagarinho.",
    tip: "Tenta tocar nas nuvens com a cabeça!",
    beats: 3,
    styles: ["ballet"],
  },
  {
    id: "braco-bailarina",
    name: "Braços de Cisne",
    emoji: "🦢",
    anim: "braco-bailarina",
    instruction: "Abre os braços em arco, suaves como asas de cisne.",
    tip: "Os braços são asas e tu vais voar!",
    beats: 3,
    styles: ["ballet"],
  },
  {
    id: "apontar",
    name: "Apontar Disco",
    emoji: "👆",
    anim: "apontar",
    instruction: "Aponta para o céu, aponta para o chão. Céu, chão, céu, chão!",
    tip: "O movimento mais famoso da disco. Aponta com estilo!",
    beats: 4,
    styles: ["disco"],
  },
  {
    id: "moonwalk",
    name: "Passo da Lua",
    emoji: "🌙",
    anim: "moonwalk",
    instruction: "Desliza um pé para trás enquanto o outro fica no chão. Parece que andas na lua!",
    tip: "Super difícil, super fixe. Devagarinho!",
    beats: 4,
    styles: ["hiphop", "robo"],
  },
  {
    id: "estatua",
    name: "Estátua!",
    emoji: "🗿",
    anim: "estatua",
    instruction: "Fica completamente parado como uma estátua. Nem um dedo se mexe!",
    tip: "Até as estátuas respiram. Mas só isso!",
    beats: 4,
    styles: ["robo", "hiphop", "ballet", "festa", "disco"],
  },
];

export const moveById = (id: string): Move => MOVES.find((m) => m.id === id)!;
export const movesForStyle = (style: StyleId): Move[] => MOVES.filter((m) => m.styles.includes(style));
