import type { GeneratedManifest, StyleId } from "../../shared/types";

/**
 * Recursos pré-gerados com fal.ai (npm run generate-assets).
 * Se não existirem, a app usa os recursos integrados (SVG, síntese, voz do browser).
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

/** Mesmo hash simples (FNV-1a) usado no servidor/script para indexar vozes. */
export function textKey(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function generatedVoice(text: string): string | undefined {
  return manifest?.voice[textKey(text)];
}
export function mascotImage(style: StyleId): string | undefined {
  return manifest?.mascots[style]?.image;
}
export function mascotVideo(style: StyleId): string | undefined {
  return manifest?.mascots[style]?.video;
}
export function styleMusic(style: StyleId): string | undefined {
  return manifest?.music[style];
}
