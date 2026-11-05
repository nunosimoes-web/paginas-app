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
  // Ordem = prioridade de geração (a voz pt-PT tem quota diária): primeiro o que as lições usam.
  u.counts.forEach((c) => lines.add(c));
  [u.stepWatchVoice, u.stepSlowVoice, u.stepMusicVoice, u.stepAskVoice, u.lessonIntro3, u.lessonIntro4, u.lessonIntro5, u.choreoReadyVoice].forEach((p) =>
    lines.add(p),
  );
  Object.values(d.moves).forEach((m) => lines.add(`${m.name}. ${m.instruction}`));
  Object.values(d.moves).forEach((m) => lines.add(m.name));
  Object.values(d.styles).forEach((s) => lines.add(s.greeting));
  [u.lessonDone1, u.lessonDone2, u.lessonDone3, u.dance, u.freeze, u.welcome, u.welcomeBack, u.askName, u.pickStyleVoice, u.whoDancesVoice].forEach((p) => lines.add(p));
  [...d.praise.slice(0, 10), ...d.freezeOk, ...d.freezeFail].forEach((p) => lines.add(p));
  [u.freezeIntroVoice, u.simonIntroVoice, u.simonYourTurnVoice, u.watch, u.levelUpVoice, u.almostWas, u.stageIntroVoice, u.stickersVoice,
    u.studioIntroVoice, u.championVoice, u.heldVoice, u.createdVoice, u.filmingVoice, u.aliveVoice].forEach((p) => lines.add(p));
  return [...lines];
}
