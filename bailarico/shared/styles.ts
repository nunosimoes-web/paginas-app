import type { StyleId } from "./types.js";

export interface DanceStyle {
  id: StyleId;
  name: string;
  tagline: string;
  mascot: {
    name: string;
    emoji: string;
    greeting: string;
    /** Descrição usada para gerar a imagem do mascote no fal.ai */
    prompt: string;
  };
  bpm: number;
  beatsPerBar: 3 | 4;
  /** Cores da identidade do estilo */
  colors: { main: string; dark: string; glow: string };
  /** Padrão musical sintetizado (ver audio/beat.ts) */
  pattern: "robo" | "boombap" | "waltz" | "samba" | "fourfloor";
}

export const STYLES: DanceStyle[] = [
  {
    id: "robo",
    name: "Dança do Robô",
    tagline: "Bip bop! Movimentos quadrados e muito divertidos.",
    mascot: {
      name: "Rita Robô",
      emoji: "🤖",
      greeting: "Bip bop! Eu sou a Rita Robô. Vamos dançar como máquinas?",
      prompt:
        "a friendly cute cartoon robot girl with round eyes, chrome body with pink and teal lights, dancing in a stiff funny robot pose",
    },
    bpm: 100,
    beatsPerBar: 4,
    colors: { main: "#2dd4bf", dark: "#0f766e", glow: "#99f6e4" },
    pattern: "robo",
  },
  {
    id: "hiphop",
    name: "Hipo-Hop",
    tagline: "Yo! Ritmo, atitude e muito bounce.",
    mascot: {
      name: "Hugo Hipopótamo",
      emoji: "🦛",
      greeting: "Yo! Sou o Hugo e adoro hip-hop. Preparado para saltar ao ritmo?",
      prompt:
        "a cool cartoon hippo wearing a backwards cap, gold chain and big sneakers, doing a hip hop dance move with attitude and a big grin",
    },
    bpm: 92,
    beatsPerBar: 4,
    colors: { main: "#a855f7", dark: "#6b21a8", glow: "#e9d5ff" },
    pattern: "boombap",
  },
  {
    id: "ballet",
    name: "Ballet Mágico",
    tagline: "Leve como uma pluma, graciosa como um flamingo.",
    mascot: {
      name: "Bia Flamingo",
      emoji: "🦩",
      greeting: "Olá, bailarinas e bailarinos! Eu sou a Bia. Vamos voar nas pontas dos pés?",
      prompt:
        "an elegant cute cartoon flamingo ballerina wearing a sparkly tutu and ballet shoes, standing on one leg in a graceful ballet pose",
    },
    bpm: 96,
    beatsPerBar: 3,
    colors: { main: "#f472b6", dark: "#be185d", glow: "#fbcfe8" },
    pattern: "waltz",
  },
  {
    id: "festa",
    name: "Festa Tropical",
    tagline: "Samba, anca e muita alegria!",
    mascot: {
      name: "Zé Papagaio",
      emoji: "🦜",
      greeting: "Olá, olá! Eu sou o Zé Papagaio e trago a festa comigo. Bora mexer essa anca!",
      prompt:
        "a joyful cartoon parrot with rainbow feathers wearing a carnival feather headdress and maracas, dancing samba with a huge smile",
    },
    bpm: 108,
    beatsPerBar: 4,
    colors: { main: "#fb923c", dark: "#c2410c", glow: "#fed7aa" },
    pattern: "samba",
  },
  {
    id: "disco",
    name: "Disco Dino",
    tagline: "Luzes, brilho e a bola de espelhos!",
    mascot: {
      name: "Dino Disco",
      emoji: "🦖",
      greeting: "Uau! Eu sou o Dino Disco. Liga as luzes porque vamos brilhar!",
      prompt:
        "a funky cartoon T-rex dinosaur wearing glittery disco sunglasses and a sparkling jacket, pointing up in a classic disco dance pose under a mirror ball",
    },
    bpm: 118,
    beatsPerBar: 4,
    colors: { main: "#facc15", dark: "#a16207", glow: "#fef08a" },
    pattern: "fourfloor",
  },
];

export const styleById = (id: StyleId): DanceStyle => STYLES.find((s) => s.id === id)!;
