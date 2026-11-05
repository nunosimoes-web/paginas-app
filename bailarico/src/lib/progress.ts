import { useEffect, useState } from "react";

/**
 * Progresso por dançarino. Vários dançarinos (irmãos, turma) podem partilhar o mesmo tablet:
 * cada um tem o seu nome, símbolo, estrelas e autocolantes. Tudo fica só neste aparelho.
 *
 * Estrelas: contador que SÓ SOBE. Cada conquista dá estrelas na hora (com animação), em todas as
 * atividades, e repetir também dá estrelas (praticar é o que se quer premiar).
 */
export interface Progress {
  id: string;
  name: string;
  avatar: string;
  /** total de estrelas ganhas (mostrado no topo) */
  starCount: number;
  /** melhor resultado por lição (0..3), para mostrar na lista de lições */
  stars: Record<string, number>;
  stickers: string[]; // lessonId
  dances: number;
  bestFreeze: number;
  bestSimon: number;
  energy: number;
  createdAt: string;
}

interface Store {
  current: string | null;
  dancers: Progress[];
}

const KEY = "dancelab.dancers.v1";
const OLD_KEY = "bailarico.progress.v1";

const blank = (name = "", avatar = "⭐"): Progress => ({
  id: Math.random().toString(36).slice(2, 10),
  name,
  avatar,
  starCount: 0,
  stars: {},
  stickers: [],
  dances: 0,
  bestFreeze: 0,
  bestSimon: 0,
  energy: 0,
  createdAt: new Date().toISOString(),
});

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Store;
      s.dancers = s.dancers.map((d) => ({ ...blank(), ...d }));
      return s;
    }
    // migração do formato antigo (um só dançarino)
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const o = JSON.parse(old) as Partial<Progress>;
      if (o.name) {
        const lessonStars = Object.values(o.stars ?? {}).reduce((a, b) => a + b, 0);
        const d = { ...blank(o.name, o.avatar), ...o, starCount: lessonStars } as Progress;
        d.id ||= blank().id;
        return { current: d.id, dancers: [d] };
      }
    }
  } catch {
    /* sem armazenamento */
  }
  return { current: null, dancers: [] };
}

let store: Store = read();
const listeners = new Set<() => void>();
const EMPTY = blank();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* modo privado: continua só em memória */
  }
  listeners.forEach((l) => l());
}

const currentDancer = (): Progress => store.dancers.find((d) => d.id === store.current) ?? EMPTY;

function patchCurrent(fn: (p: Progress) => Partial<Progress>) {
  const cur = currentDancer();
  if (cur === EMPTY) return;
  store = { ...store, dancers: store.dancers.map((d) => (d.id === cur.id ? { ...d, ...fn(d) } : d)) };
  save();
}

/** Evento para a animação de estrela a voar até ao contador. */
export const STAR_EVENT = "dancelab:star";

export const progress = {
  get: currentDancer,
  dancers: () => store.dancers,
  update(patch: Partial<Progress> | ((p: Progress) => Partial<Progress>)) {
    patchCurrent((p) => (typeof patch === "function" ? patch(p) : patch));
  },
  /** Dá estrelas já, com animação e som. */
  addStars(n: number) {
    if (n <= 0) return;
    patchCurrent((p) => ({ starCount: p.starCount + n }));
    window.dispatchEvent(new CustomEvent(STAR_EVENT, { detail: n }));
  },
  completeLesson(lessonId: string) {
    patchCurrent((p) => ({
      stars: { ...p.stars, [lessonId]: 3 },
      stickers: p.stickers.includes(lessonId) ? p.stickers : [...p.stickers, lessonId],
      dances: p.dances + 1,
    }));
  },
  addEnergy(n: number) {
    patchCurrent((p) => ({ energy: p.energy + Math.round(n) }));
  },
  addDancer(name: string, avatar: string) {
    const d = blank(name, avatar);
    store = { current: d.id, dancers: [...store.dancers, d] };
    save();
  },
  switchTo(id: string) {
    store = { ...store, current: id };
    save();
  },
  removeDancer(id: string) {
    const dancers = store.dancers.filter((d) => d.id !== id);
    store = { current: store.current === id ? (dancers[0]?.id ?? null) : store.current, dancers };
    save();
  },
  reset() {
    patchCurrent((p) => ({ ...blank(p.name, p.avatar), id: p.id }));
  },
};

export function useProgress(): Progress {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return currentDancer();
}

export function useDancers(): Progress[] {
  useProgress();
  return store.dancers;
}

export const totalStars = (p: Progress) => p.starCount;
