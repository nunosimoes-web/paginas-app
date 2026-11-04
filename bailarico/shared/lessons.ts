import type { StyleId } from "./types.js";

export interface Lesson {
  id: string;
  style: StyleId;
  title: string;
  level: 1 | 2 | 3;
  /** ids de movimentos, na ordem em que são ensinados */
  moves: string[];
  /** Autocolante desbloqueado ao terminar */
  sticker: { emoji: string; name: string };
}

export const LESSONS: Lesson[] = [
  // Robô
  { id: "robo-1", style: "robo", title: "Ligar o Robô", level: 1, moves: ["marcha", "robo-bracos", "estatua"], sticker: { emoji: "🔋", name: "Pilha Cheia" } },
  { id: "robo-2", style: "robo", title: "Robô Avançado", level: 2, moves: ["robo-cabeca", "robo-bracos", "onda", "passo-lado"], sticker: { emoji: "⚙️", name: "Engrenagem Dourada" } },
  { id: "robo-3", style: "robo", title: "Robô do Futuro", level: 3, moves: ["marcha", "robo-cabeca", "moonwalk", "onda", "estatua"], sticker: { emoji: "🛸", name: "Nave Robô" } },
  // Hip-hop
  { id: "hiphop-1", style: "hiphop", title: "Primeiro Bounce", level: 1, moves: ["bounce", "passo-lado", "palmas"], sticker: { emoji: "🧢", name: "Boné ao Contrário" } },
  { id: "hiphop-2", style: "hiphop", title: "Atitude Cool", level: 2, moves: ["bounce", "ombros", "bracos-ar", "onda"], sticker: { emoji: "🎧", name: "Headphones de Ouro" } },
  { id: "hiphop-3", style: "hiphop", title: "Rei do Bairro", level: 3, moves: ["bounce", "ombros", "moonwalk", "salto", "estatua"], sticker: { emoji: "👑", name: "Coroa Hip-Hop" } },
  // Ballet
  { id: "ballet-1", style: "ballet", title: "Primeiros Passos", level: 1, moves: ["plie", "pontas", "braco-bailarina"], sticker: { emoji: "🩰", name: "Sapatilhas Rosa" } },
  { id: "ballet-2", style: "ballet", title: "Cisne Pequeno", level: 2, moves: ["pontas", "braco-bailarina", "giro", "plie"], sticker: { emoji: "🦢", name: "Pena de Cisne" } },
  { id: "ballet-3", style: "ballet", title: "Grande Bailarina", level: 3, moves: ["plie", "pontas", "bracos-ar", "giro", "estatua"], sticker: { emoji: "💎", name: "Tiara Brilhante" } },
  // Festa
  { id: "festa-1", style: "festa", title: "Começa a Festa", level: 1, moves: ["anca", "palmas", "passo-lado"], sticker: { emoji: "🎉", name: "Confetti Mágico" } },
  { id: "festa-2", style: "festa", title: "Samba Pequenina", level: 2, moves: ["samba-pes", "anca", "bracos-ar", "chuto"], sticker: { emoji: "🪇", name: "Maracas Douradas" } },
  { id: "festa-3", style: "festa", title: "Carnaval Total", level: 3, moves: ["samba-pes", "anca", "giro", "salto", "estatua"], sticker: { emoji: "🎭", name: "Máscara de Carnaval" } },
  // Disco
  { id: "disco-1", style: "disco", title: "Luzes Ligadas", level: 1, moves: ["apontar", "passo-lado", "palmas"], sticker: { emoji: "🕶️", name: "Óculos Disco" } },
  { id: "disco-2", style: "disco", title: "Bola de Espelhos", level: 2, moves: ["bounce", "apontar", "anca", "giro"], sticker: { emoji: "🪩", name: "Bola de Espelhos" } },
  { id: "disco-3", style: "disco", title: "Estrela da Pista", level: 3, moves: ["apontar", "chuto", "salto", "giro", "estatua"], sticker: { emoji: "🌟", name: "Super Estrela" } },
];

export const lessonsForStyle = (style: StyleId): Lesson[] => LESSONS.filter((l) => l.style === style);
export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
