import path from "node:path";
import { STYLE_DEFS, MOVE_DEFS, ART_VERSION, clipMovesForStyle } from "../shared/catalog.js";
import { allVoiceLines } from "../shared/i18n/index.js";
import { LOCALES, type GeneratedManifest, type Locale } from "../shared/types.js";
import { generatedDir, readJson, writeJson, textKey } from "./cache.js";
import { synthesize } from "./tts.js";
import { mascotImage, mascotClip, instrumental, heroImage } from "./fal.js";
import { config } from "./config.js";

/**
 * Pré-geração: vozes (por língua), mascotes (imagem + clip de boas-vindas),
 * clips de cada passo por estilo e uma música instrumental por estilo.
 * Idempotente: o que já existe no manifesto não volta a ser pedido.
 */

export interface GenerateOptions {
  images?: boolean;
  clips?: boolean;
  music?: boolean;
  voice?: boolean;
  locales?: Locale[];
}

export interface GenerateProgress {
  running: boolean;
  startedAt?: string;
  finishedAt?: string;
  done: number;
  total: number;
  current?: string;
  errors: string[];
}

export const progress: GenerateProgress = { running: false, done: 0, total: 0, errors: [] };
export const manifestPath = () => path.join(generatedDir(), "manifest.json");

export async function loadManifest(): Promise<GeneratedManifest> {
  const m = await readJson<GeneratedManifest>(manifestPath());
  if (m && m.artVersion === ART_VERSION && m.clips) return m;
  // versão visual nova: recomeça mascotes/clips mas mantém vozes e músicas
  return {
    generatedAt: new Date().toISOString(),
    artVersion: ART_VERSION,
    mascots: {},
    clips: {},
    music: m?.music ?? {},
    voice: m?.voice ?? {},
  };
}

async function pool<T>(items: T[], limit: number, fn: (t: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

export async function generateAll(opts: GenerateOptions, publicBase = "", log: (s: string) => void = console.log) {
  if (progress.running) throw new Error("Geração já em curso");
  const { images = true, clips = true, music = true, voice = true, locales = LOCALES } = opts;
  const manifest = await loadManifest();
  const save = () => writeJson(manifestPath(), { ...manifest, generatedAt: new Date().toISOString() });

  const voiceJobs: { locale: Locale; line: string }[] = [];
  if (voice) {
    for (const locale of locales) {
      if (!config.ttsEnabled(locale)) continue;
      const have = (manifest.voice[locale] ??= {});
      allVoiceLines(locale).filter((l) => !have[textKey(l)]).forEach((line) => voiceJobs.push({ locale, line }));
    }
  }
  const imageJobs = images ? STYLE_DEFS.filter((s) => !manifest.mascots[s.id]?.image) : [];
  const heroJob = images && !manifest.hero ? 1 : 0;
  const musicJobs = music ? STYLE_DEFS.filter((s) => !manifest.music[s.id]) : [];
  const clipJobs: { styleId: (typeof STYLE_DEFS)[number]["id"]; moveId: string }[] = [];
  if (clips) {
    for (const s of STYLE_DEFS) {
      if (!manifest.mascots[s.id]?.idle) clipJobs.push({ styleId: s.id, moveId: "__idle" });
      for (const m of clipMovesForStyle(s.id)) if (!manifest.clips[s.id]?.[m]) clipJobs.push({ styleId: s.id, moveId: m });
    }
  }

  Object.assign(progress, {
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: undefined,
    done: 0,
    total: voiceJobs.length + imageJobs.length + heroJob + musicJobs.length + clipJobs.length,
    errors: [],
  });
  const step = (label: string) => {
    progress.done++;
    progress.current = label;
    log(`[${progress.done}/${progress.total}] ${label}`);
  };
  const fail = (label: string, e: unknown) => progress.errors.push(`${label}: ${(e as Error).message}`);

  // Uma fila por língua (fornecedores diferentes), todas em paralelo.
  const voices = Promise.all(
    locales.map((loc) =>
      pool(voiceJobs.filter((j) => j.locale === loc), 2, async ({ locale, line }) => {
        try {
          const r = await synthesize(line, locale, "background");
          manifest.voice[locale]![textKey(line)] = r.url;
          await save();
        } catch (e) {
          fail(`voz ${locale} "${line.slice(0, 30)}"`, e);
        }
        step(`voz ${locale}: ${line.slice(0, 40)}`);
      }),
    ),
  );

  const visuals = (async () => {
    // imagens dos mascotes (precisas antes dos clips)
    await pool(imageJobs, 3, async (s) => {
      try {
        (manifest.mascots[s.id] ??= {}).image = await mascotImage(s.id, s.mascotPrompt, ART_VERSION);
        await save();
      } catch (e) {
        fail(`imagem ${s.id}`, e);
      }
      step(`mascote ${s.id}`);
    });

    // 3) música instrumental por estilo
    await pool(musicJobs, 2, async (s) => {
      try {
        manifest.music[s.id] = await instrumental(s.id, s.musicPrompt);
        await save();
      } catch (e) {
        fail(`música ${s.id}`, e);
      }
      step(`música ${s.id}`);
    });

    // 4) clips (lentos: 1-3 min cada, 3 em paralelo)
    await pool(clipJobs, 3, async ({ styleId, moveId }) => {
      const s = STYLE_DEFS.find((x) => x.id === styleId)!;
      const img = manifest.mascots[styleId]?.image;
      if (!img) {
        step(`clip ${styleId}/${moveId} (sem imagem)`);
        return;
      }
      try {
        if (moveId === "__idle") {
          (manifest.mascots[styleId] ??= {}).idle = await mascotClip(styleId, moveId, img, s.idlePrompt, publicBase);
        } else {
          const mv = MOVE_DEFS.find((m) => m.id === moveId)!;
          (manifest.clips[styleId] ??= {})[moveId] = await mascotClip(styleId, moveId, img, mv.clipPrompt, publicBase);
        }
        await save();
      } catch (e) {
        fail(`clip ${styleId}/${moveId}`, e);
      }
      step(`clip ${styleId}/${moveId}`);
    });
  })();

  try {
    // vozes (Gemini em fila própria) e visuais (fal.ai) correm ao mesmo tempo
    await Promise.all([voices, visuals]);
    await save();
  } finally {
    progress.running = false;
    progress.finishedAt = new Date().toISOString();
    progress.current = undefined;
  }
  return manifest;
}
