import { useEffect, useState } from "react";

export interface Progress {
  name: string;
  avatar: string;
  stars: Record<string, number>; // lessonId -> 0..3
  stickers: string[]; // lessonId
  dances: number; // total de danças completas
  bestFreeze: number; // melhor ronda no jogo Estátua
  bestSimon: number; // melhor nível no Segue o Mestre
  energy: number; // energia total acumulada (pontos)
  createdAt: string;
}

const KEY = "bailarico.progress.v1";

const DEFAULT: Progress = {
  name: "",
  avatar: "⭐",
  stars: {},
  stickers: [],
  dances: 0,
  bestFreeze: 0,
  bestSimon: 0,
  energy: 0,
  createdAt: new Date().toISOString(),
};

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    return { ...DEFAULT };
  }
}

let state: Progress = read();
const listeners = new Set<(p: Progress) => void>();

function write(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // modo privado ou sem armazenamento: continua só em memória
  }
  listeners.forEach((l) => l(state));
}

export const progress = {
  get: () => state,
  update(patch: Partial<Progress> | ((p: Progress) => Partial<Progress>)) {
    const p = typeof patch === "function" ? patch(state) : patch;
    write({ ...state, ...p });
  },
  awardStars(lessonId: string, stars: number) {
    const prev = state.stars[lessonId] ?? 0;
    write({
      ...state,
      stars: { ...state.stars, [lessonId]: Math.max(prev, stars) },
      stickers: state.stickers.includes(lessonId) ? state.stickers : [...state.stickers, lessonId],
      dances: state.dances + 1,
    });
  },
  addEnergy(n: number) {
    write({ ...state, energy: state.energy + Math.round(n) });
  },
  reset() {
    write({ ...DEFAULT, createdAt: new Date().toISOString() });
  },
};

export function useProgress(): Progress {
  const [p, setP] = useState(state);
  useEffect(() => {
    listeners.add(setP);
    return () => {
      listeners.delete(setP);
    };
  }, []);
  return p;
}

export const totalStars = (p: Progress) => Object.values(p.stars).reduce((a, b) => a + b, 0);
