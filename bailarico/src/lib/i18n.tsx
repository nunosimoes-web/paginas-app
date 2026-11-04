import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALES, type Locale, type StyleId } from "../../shared/types.js";
import { getDict, isLocale, localizedLessons, localizedMoves, localizedStyles, fmt, type Dict, type UiStrings, type Style, type Move, type Lesson } from "../../shared/i18n/index.js";
import { setVoiceLocale } from "../audio/voice";

const KEY = "bailarico.locale";

function detectLocale(): Locale {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (isLocale(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("pt")) return "pt-PT";
  if (nav.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

export interface I18n {
  locale: Locale;
  locales: Locale[];
  setLocale: (l: Locale) => void;
  dict: Dict;
  t: UiStrings;
  f: (template: string, vars: Record<string, string | number>) => string;
  styles: Style[];
  moves: Move[];
  lessons: Lesson[];
  styleById: (id: StyleId) => Style;
  moveById: (id: string) => Move;
  lessonById: (id: string) => Lesson | undefined;
  lessonsForStyle: (id: StyleId) => Lesson[];
  movesForStyle: (id: StyleId) => Move[];
  pick: <T>(arr: T[]) => T;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    setVoiceLocale(locale);
    try {
      localStorage.setItem(KEY, locale); // mantém a língua detetada (ex.: ?lang=) nas visitas seguintes
    } catch {
      /* ignore */
    }
  }, [locale]);

  const value = useMemo<I18n>(() => {
    const dict = getDict(locale);
    const styles = localizedStyles(locale);
    const moves = localizedMoves(locale);
    const lessons = localizedLessons(locale);
    return {
      locale,
      locales: LOCALES,
      setLocale,
      dict,
      t: dict.ui,
      f: fmt,
      styles,
      moves,
      lessons,
      styleById: (id) => styles.find((s) => s.id === id)!,
      moveById: (id) => moves.find((m) => m.id === id)!,
      lessonById: (id) => lessons.find((l) => l.id === id),
      lessonsForStyle: (id) => lessons.filter((l) => l.style === id),
      movesForStyle: (id) => moves.filter((m) => m.styles.includes(id)),
      pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    };
  }, [locale, setLocale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n fora do I18nProvider");
  return v;
}
