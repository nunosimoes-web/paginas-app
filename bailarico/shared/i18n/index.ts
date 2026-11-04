import type { Locale, StyleId } from "../types.js";
import { DEFAULT_LOCALE, LOCALES } from "../types.js";
import { STYLE_DEFS, MOVE_DEFS, LESSON_DEFS, type StyleDef, type MoveDef, type LessonDef } from "../catalog.js";
import type { Dict } from "./dict.js";
import { ptPT } from "./pt-PT.js";
import { en } from "./en.js";

export { fmt } from "./dict.js";
export type { Dict, UiStrings } from "./dict.js";

export const DICTS: Record<Locale, Dict> = { "pt-PT": ptPT, en };

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as string[]).includes(x);
}

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}

export type Style = StyleDef & Dict["styles"][StyleId] & { mascot: { emoji: string } };
export type Move = MoveDef & Dict["moves"][string];
export type Lesson = LessonDef & Dict["lessons"][string] & { stickerName: string };

export function localizedStyles(locale: Locale): Style[] {
  const d = getDict(locale);
  return STYLE_DEFS.map((s) => ({ ...s, ...d.styles[s.id], mascot: { emoji: s.emoji } }));
}
export function localizedMoves(locale: Locale): Move[] {
  const d = getDict(locale);
  return MOVE_DEFS.map((m) => ({ ...m, ...(d.moves[m.id] ?? { name: m.id, instruction: "", tip: "" }) }));
}
export function localizedLessons(locale: Locale): Lesson[] {
  const d = getDict(locale);
  return LESSON_DEFS.map((l) => ({ ...l, ...d.lessons[l.id], stickerName: d.lessons[l.id].sticker }));
}

/** Todas as frases faladas numa língua (para pré-geração de voz). */
export function allVoiceLines(locale: Locale): string[] {
  const d = getDict(locale);
  const u = d.ui;
  const lines = new Set<string>();
  Object.values(d.styles).forEach((s) => lines.add(s.greeting));
  Object.values(d.moves).forEach((m) => {
    lines.add(m.name);
    lines.add(`${m.name}. ${m.instruction}`);
    lines.add(m.tip);
  });
  [...d.praise, ...d.encourage, ...d.freezeOk, ...d.freezeFail].forEach((p) => lines.add(p));
  [u.welcome, u.pickStyleVoice, u.watch, u.yourTurn, u.choreo, u.freezeIntroVoice, u.dance, u.freeze, u.simonIntroVoice, u.simonYourTurnVoice,
    u.stageIntroVoice, u.stickersVoice, u.studioIntroVoice, u.championVoice, u.filmingVoice, u.aliveVoice, u.barFull].forEach((p) => lines.add(p));
  return [...lines];
}
