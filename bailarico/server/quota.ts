import { config } from "./config.js";

/** Limites diários simples, em memória, para evitar surpresas na fatura do fal.ai. */
type Kind = "images" | "videos" | "songs";
const used: Record<Kind, { day: string; n: number }> = {
  images: { day: "", n: 0 },
  videos: { day: "", n: 0 },
  songs: { day: "", n: 0 },
};

const today = () => new Date().toISOString().slice(0, 10);

export function left(kind: Kind): number {
  const u = used[kind];
  if (u.day !== today()) {
    u.day = today();
    u.n = 0;
  }
  return Math.max(0, config.quotas[kind] - u.n);
}

export function consume(kind: Kind): boolean {
  if (left(kind) <= 0) return false;
  used[kind].n++;
  return true;
}
