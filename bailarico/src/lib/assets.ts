import type { GeneratedManifest, Locale, StyleId } from "../../shared/types.js";

/**
 * Recursos pré-gerados (vozes, mascotes, clips, músicas), servidos em /generated e /media.
 * Se não existirem, a app usa os recursos integrados.
 */
let manifest: GeneratedManifest | null = null;

export async function loadManifest(): Promise<GeneratedManifest | null> {
  try {
    const r = await fetch("generated/manifest.json", { cache: "no-store" });
    if (!r.ok) return null;
    manifest = (await r.json()) as GeneratedManifest;
    return manifest;
  } catch {
    return null;
  }
}

/** Mesmo FNV-1a do servidor, para indexar vozes pelo texto. */
export function textKey(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export const generatedVoice = (locale: Locale, text: string) => manifest?.voice?.[locale]?.[textKey(text)];
export const mascotImage = (style: StyleId) => manifest?.mascots?.[style]?.image;
export const heroImage = () => manifest?.hero;
export const mascotIdle = (style: StyleId) => manifest?.mascots?.[style]?.idle;
export const moveClip = (style: StyleId, moveId: string) => manifest?.clips?.[style]?.[moveId];
export const styleMusic = (style: StyleId) => manifest?.music?.[style];
export const hasClips = (style: StyleId) => Object.keys(manifest?.clips?.[style] ?? {}).length > 0;

/** Pré-carrega clips de uma lição para não haver esperas. */
export function preloadClips(urls: (string | undefined)[]) {
  urls.filter(Boolean).forEach((u) => {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.src = u!;
  });
}
