import type { StyleId } from "./types.js";

/**
 * Catálogo neutro (sem texto visível): estrutura dos estilos, passos e lições.
 * Todo o texto apresentado às crianças vive em shared/i18n/<língua>.ts.
 * Os prompts para os modelos de IA ficam aqui, em inglês, porque é assim que
 * os modelos respondem melhor.
 */

export const ART_VERSION = 2;

export interface StyleDef {
  id: StyleId;
  emoji: string;
  bpm: number;
  beatsPerBar: 3 | 4;
  colors: { main: string; dark: string; glow: string };
  pattern: "robo" | "boombap" | "waltz" | "samba" | "fourfloor";
  /** descrição do mascote para a imagem (estilo global acrescentado em runtime) */
  mascotPrompt: string;
  /** como o mascote se apresenta no clip de boas-vindas */
  idlePrompt: string;
  /** descrição musical para a faixa instrumental */
  musicPrompt: string;
}

export const STYLE_DEFS: StyleDef[] = [
  {
    id: "robo",
    emoji: "🤖",
    bpm: 100,
    beatsPerBar: 4,
    colors: { main: "#2dd4bf", dark: "#0f766e", glow: "#99f6e4" },
    pattern: "robo",
    mascotPrompt:
      "a charming, stylish robot girl dance teacher, sleek glossy white and rose-gold chassis with teal light accents, expressive big eyes, confident playful smile, elegant dancer proportions, one arm raised, clean minimal pastel dance-studio background",
    idlePrompt: "waves hello to the camera, then does a few crisp playful robot-dance moves in place, smiling",
    musicPrompt: "playful electronic robot funk, 100 bpm, chiptune synths, vocoder-style stabs, crisp drum machine, kids party",
  },
  {
    id: "hiphop",
    emoji: "🦛",
    bpm: 92,
    beatsPerBar: 4,
    colors: { main: "#a855f7", dark: "#6b21a8", glow: "#e9d5ff" },
    pattern: "boombap",
    mascotPrompt:
      "a cool, stylish cartoon hippo hip-hop dancer, streetwear hoodie, backwards cap, chunky sneakers, confident grin, standing in a relaxed b-boy stance, urban dance studio with a graffiti wall softly blurred",
    idlePrompt: "nods to the beat, waves hello with a cool two-finger salute, then bounces and grooves in place with hip-hop attitude",
    musicPrompt: "fun kid-friendly old school hip hop, 92 bpm, boom bap drums, funky bass, hand claps, scratches, upbeat",
  },
  {
    id: "ballet",
    emoji: "🦩",
    bpm: 96,
    beatsPerBar: 3,
    colors: { main: "#f472b6", dark: "#be185d", glow: "#fbcfe8" },
    pattern: "waltz",
    mascotPrompt:
      "an elegant cartoon flamingo ballerina, slender graceful neck, sparkling pink tutu, satin pointe shoes, poised en pointe with arms in fifth position, airy sunlit ballet studio with barre and mirrors softly blurred",
    idlePrompt: "gives a graceful curtsy to the camera, then sways gently in place with soft flowing arm movements",
    musicPrompt: "gentle magical waltz in 3/4, 96 bpm, music box, pizzicato strings, harp, dreamy and sparkly, for children",
  },
  {
    id: "festa",
    emoji: "🦜",
    bpm: 108,
    beatsPerBar: 4,
    colors: { main: "#fb923c", dark: "#c2410c", glow: "#fed7aa" },
    pattern: "samba",
    mascotPrompt:
      "a joyful cartoon parrot carnival dancer, vibrant rainbow feathers, feathered carnival headdress, maracas in wings, mid samba step with hips swaying, warm tropical stage with soft bokeh lights",
    idlePrompt: "shakes the maracas in greeting, laughs, and does a light bouncy samba sway in place",
    musicPrompt: "joyful tropical samba carnival for kids, 108 bpm, surdo drums, tamborim, agogo, bright brass, whistles, party energy",
  },
  {
    id: "disco",
    emoji: "🦖",
    bpm: 118,
    beatsPerBar: 4,
    colors: { main: "#facc15", dark: "#a16207", glow: "#fef08a" },
    pattern: "fourfloor",
    mascotPrompt:
      "a funky cartoon T-rex disco dancer, glittery sequin jacket, star-shaped disco sunglasses, flared purple trousers, platform sneakers, classic disco point-up pose, under a sparkling mirror ball on a glowing dance floor softly blurred",
    idlePrompt: "points to the camera with a big grin, then grooves in place with disco hip sways and finger points",
    musicPrompt: "sparkly 70s disco for kids, 118 bpm, four on the floor, funky guitar, lush strings, hand claps, uplifting",
  },
];

export type MoveAnim =
  | "idle" | "palmas" | "bracos-ar" | "passo-lado" | "robo" | "robo-cabeca" | "giro" | "salto" | "anca" | "onda"
  | "chuto" | "estatua" | "plie" | "pontas" | "braco-bailarina" | "moonwalk" | "apontar" | "bounce" | "ombros" | "samba-pes" | "marcha";

export interface MoveDef {
  id: string;
  emoji: string;
  anim: MoveAnim;
  beats: number;
  styles: StyleId[];
  /** descrição do movimento para o vídeo (Kling) */
  clipPrompt: string;
}

export const MOVE_DEFS: MoveDef[] = [
  { id: "bounce", emoji: "🏀", anim: "bounce", beats: 4, styles: ["hiphop", "disco", "festa"], clipPrompt: "bounces rhythmically in place by bending and straightening the knees to the beat, shoulders loose, arms swinging gently, relaxed confident groove" },
  { id: "palmas", emoji: "👏", anim: "palmas", beats: 4, styles: ["disco", "festa", "hiphop"], clipPrompt: "claps hands high above the head on the beat, repeatedly, bouncing lightly, big joyful smile" },
  { id: "bracos-ar", emoji: "🙌", anim: "bracos-ar", beats: 4, styles: ["disco", "festa", "hiphop", "ballet"], clipPrompt: "raises one arm straight up as if catching a star, brings it down, then raises the other arm, alternating smoothly to the beat while bouncing lightly" },
  { id: "passo-lado", emoji: "👟", anim: "passo-lado", beats: 4, styles: ["hiphop", "disco", "festa", "robo"], clipPrompt: "does a side step: steps to the right and brings feet together, then steps to the left and brings feet together, repeating to the beat, arms swinging naturally" },
  { id: "robo-bracos", emoji: "🦾", anim: "robo", beats: 4, styles: ["robo"], clipPrompt: "performs the classic robot dance with the arms: bends and moves the arms in crisp right-angle segments with mechanical stop-and-go motion, torso still" },
  { id: "robo-cabeca", emoji: "🔩", anim: "robo-cabeca", beats: 4, styles: ["robo"], clipPrompt: "robot head isolation: turns the head sharply to one side, pauses, then to the other side, with mechanical ticking stops, arms held bent at right angles" },
  { id: "marcha", emoji: "🤖", anim: "marcha", beats: 4, styles: ["robo"], clipPrompt: "marches in place like a robot: lifts the knees high with stiff legs and swings stiff straight arms, mechanical rhythm" },
  { id: "onda", emoji: "🌊", anim: "onda", beats: 4, styles: ["hiphop", "robo"], clipPrompt: "does the arm wave: a smooth wave travels from the fingertips of one hand, through the elbow and shoulders, across the chest to the other hand, fluid and continuous" },
  { id: "ombros", emoji: "😎", anim: "ombros", beats: 4, styles: ["hiphop"], clipPrompt: "shoulder bounce: lifts and drops one shoulder, then the other, alternating to the beat with a cool head nod" },
  { id: "giro", emoji: "🌀", anim: "giro", beats: 4, styles: ["ballet", "disco", "festa"], clipPrompt: "turns a full slow 360-degree spin in place in four small steps, arms held out gracefully, finishing facing the camera with a smile" },
  { id: "salto", emoji: "⭐", anim: "salto", beats: 4, styles: ["disco", "festa", "hiphop"], clipPrompt: "does two star jumps: jumps up spreading arms and legs wide into a star shape, lands with feet together, and repeats" },
  { id: "anca", emoji: "🍑", anim: "anca", beats: 4, styles: ["festa", "disco"], clipPrompt: "sways the hips side to side to the beat in a playful, exaggerated way, arms relaxed and moving with the sway" },
  { id: "samba-pes", emoji: "🪘", anim: "samba-pes", beats: 4, styles: ["festa"], clipPrompt: "quick samba footwork: small fast steps forward and back, light on the feet, hips bouncing, joyful" },
  { id: "chuto", emoji: "🦵", anim: "chuto", beats: 4, styles: ["festa", "disco"], clipPrompt: "kicks one leg forward to the beat, then the other, alternating kicks, arms out for balance" },
  { id: "plie", emoji: "🧸", anim: "plie", beats: 3, styles: ["ballet"], clipPrompt: "ballet plié: slowly bends the knees outward with a straight back and rounded arms in front, then rises smoothly, repeating gracefully" },
  { id: "pontas", emoji: "🩰", anim: "pontas", beats: 3, styles: ["ballet"], clipPrompt: "rises slowly onto the tips of the toes, stretching tall with arms lifting overhead, holds, then lowers gently, repeating" },
  { id: "braco-bailarina", emoji: "🦢", anim: "braco-bailarina", beats: 3, styles: ["ballet"], clipPrompt: "swan arms: opens both arms wide in a soft rounded arc and slowly lifts them overhead like wings, flowing and graceful" },
  { id: "apontar", emoji: "👆", anim: "apontar", beats: 4, styles: ["disco"], clipPrompt: "classic disco point: points one arm up to the sky, then down across the body to the floor, alternating with hip sways to the beat" },
  { id: "moonwalk", emoji: "🌙", anim: "moonwalk", beats: 4, styles: ["hiphop", "robo"], clipPrompt: "does a smooth moonwalk, gliding backwards: one foot slides back while the other stays flat, smooth and effortless" },
  { id: "estatua", emoji: "🗿", anim: "estatua", beats: 4, styles: ["robo", "hiphop", "ballet", "festa", "disco"], clipPrompt: "dances for a moment, then suddenly freezes completely still in a fun statue pose, holding perfectly motionless with a frozen smile" },
];

export interface LessonDef {
  id: string;
  style: StyleId;
  level: 1 | 2 | 3;
  moves: string[];
  stickerEmoji: string;
}

export const LESSON_DEFS: LessonDef[] = [
  { id: "robo-1", style: "robo", level: 1, moves: ["marcha", "robo-bracos", "estatua"], stickerEmoji: "🔋" },
  { id: "robo-2", style: "robo", level: 2, moves: ["robo-cabeca", "robo-bracos", "onda", "passo-lado"], stickerEmoji: "⚙️" },
  { id: "robo-3", style: "robo", level: 3, moves: ["marcha", "robo-cabeca", "moonwalk", "onda", "estatua"], stickerEmoji: "🛸" },
  { id: "hiphop-1", style: "hiphop", level: 1, moves: ["bounce", "passo-lado", "palmas"], stickerEmoji: "🧢" },
  { id: "hiphop-2", style: "hiphop", level: 2, moves: ["bounce", "ombros", "bracos-ar", "onda"], stickerEmoji: "🎧" },
  { id: "hiphop-3", style: "hiphop", level: 3, moves: ["bounce", "ombros", "moonwalk", "salto", "estatua"], stickerEmoji: "👑" },
  { id: "ballet-1", style: "ballet", level: 1, moves: ["plie", "pontas", "braco-bailarina"], stickerEmoji: "🩰" },
  { id: "ballet-2", style: "ballet", level: 2, moves: ["pontas", "braco-bailarina", "giro", "plie"], stickerEmoji: "🦢" },
  { id: "ballet-3", style: "ballet", level: 3, moves: ["plie", "pontas", "bracos-ar", "giro", "estatua"], stickerEmoji: "💎" },
  { id: "festa-1", style: "festa", level: 1, moves: ["anca", "palmas", "passo-lado"], stickerEmoji: "🎉" },
  { id: "festa-2", style: "festa", level: 2, moves: ["samba-pes", "anca", "bracos-ar", "chuto"], stickerEmoji: "🪇" },
  { id: "festa-3", style: "festa", level: 3, moves: ["samba-pes", "anca", "giro", "salto", "estatua"], stickerEmoji: "🎭" },
  { id: "disco-1", style: "disco", level: 1, moves: ["apontar", "passo-lado", "palmas"], stickerEmoji: "🕶️" },
  { id: "disco-2", style: "disco", level: 2, moves: ["bounce", "apontar", "anca", "giro"], stickerEmoji: "🪩" },
  { id: "disco-3", style: "disco", level: 3, moves: ["apontar", "chuto", "salto", "giro", "estatua"], stickerEmoji: "🌟" },
];

/** Passos que precisam de clip de vídeo para um estilo: todos os das suas lições. */
export function clipMovesForStyle(style: StyleId): string[] {
  const set = new Set<string>();
  LESSON_DEFS.filter((l) => l.style === style).forEach((l) => l.moves.forEach((m) => set.add(m)));
  return [...set];
}
