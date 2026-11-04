import path from "node:path";
import { STYLES } from "../shared/styles.js";
import { MOVES } from "../shared/moves.js";
import { PRAISE, ENCOURAGE, FREEZE_OK, FREEZE_FAIL, UI_PHRASES } from "../shared/phrases.js";
import type { GeneratedManifest, StyleId } from "../shared/types.js";
import { generatedDir, readJson, writeJson, textKey, hashKey, findCached, store } from "./cache.js";
import { tts, song } from "./fal.js";
import { config } from "./config.js";
import { fal } from "@fal-ai/client";
import { KID_IMAGE_STYLE, KID_VIDEO_PROMPT } from "./safety.js";

/**
 * Pré-geração de recursos com fal.ai: mascotes (imagem + vídeo), uma música
 * por estilo e todas as frases faladas. Corre uma vez (CLI ou /api/admin/generate)
 * e fica guardado em cache/generated/manifest.json. É idempotente: o que já
 * existe não volta a ser pedido ao fal.
 */

export interface GenerateOptions {
  images?: boolean;
  videos?: boolean;
  music?: boolean;
  voice?: boolean;
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
  return (
    (await readJson<GeneratedManifest>(manifestPath())) ?? {
      generatedAt: new Date().toISOString(),
      mascots: {},
      music: {},
      voice: {},
    }
  );
}

export function allVoiceLines(): string[] {
  const lines = new Set<string>();
  STYLES.forEach((s) => lines.add(s.mascot.greeting));
  MOVES.forEach((m) => {
    lines.add(m.name);
    lines.add(m.instruction);
    lines.add(m.tip);
  });
  [...PRAISE, ...ENCOURAGE, ...FREEZE_OK, ...FREEZE_FAIL, ...Object.values(UI_PHRASES)].forEach((p) => lines.add(p));
  return [...lines];
}

async function mascotImage(styleId: StyleId, prompt: string): Promise<string> {
  const id = "mascot-" + hashKey([config.models.image, styleId, prompt]);
  const cached = await findCached(id);
  if (cached) return cached;
  fal.config({ credentials: config.falKey });
  const res = await fal.subscribe(config.models.image, {
    input: {
      prompt: KID_IMAGE_STYLE.replace("{desc}", prompt),
      num_images: 1,
      aspect_ratio: "1:1",
      resolution: "1K",
      output_format: "png",
    },
  });
  const img = (res.data as { images: { url: string; content_type?: string }[] }).images[0];
  return store(id, img.url, img.content_type);
}

async function mascotVideo(styleId: StyleId, imagePath: string, publicBase: string): Promise<string> {
  const id = "mascotvid-" + hashKey([config.models.video, styleId, imagePath]);
  const cached = await findCached(id);
  if (cached) return cached;
  fal.config({ credentials: config.falKey });
  let imageUrl = publicBase ? publicBase + imagePath : "";
  if (!imageUrl || /localhost|127\.0\.0\.1/.test(imageUrl)) {
    const fs = await import("node:fs/promises");
    const buf = await fs.readFile(path.join(config.cacheDir, imagePath.replace(/^\//, "")));
    imageUrl = await fal.storage.upload(new Blob([buf], { type: "image/png" }));
  }
  const res = await fal.subscribe(config.models.video, {
    input: {
      start_image_url: imageUrl,
      prompt: KID_VIDEO_PROMPT,
      duration: "5",
      generate_audio: false,
      negative_prompt: "blur, distort, low quality, scary, text, watermark",
    },
  });
  const v = (res.data as { video: { url: string; content_type?: string } }).video;
  return store(id, v.url, v.content_type);
}

async function pool<T>(items: T[], limit: number, fn: (t: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function generateAll(opts: GenerateOptions, publicBase = "", log: (s: string) => void = console.log) {
  if (progress.running) throw new Error("Geração já em curso");
  const { images = true, videos = false, music = true, voice = true } = opts;
  const manifest = await loadManifest();
  const voiceLines = voice ? allVoiceLines().filter((l) => !manifest.voice[textKey(l)]) : [];
  const styleJobs = STYLES.filter(
    (s) => (images && !manifest.mascots[s.id]?.image) || (videos && !manifest.mascots[s.id]?.video) || (music && !manifest.music[s.id]),
  );
  Object.assign(progress, {
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: undefined,
    done: 0,
    total: voiceLines.length + styleJobs.length * ((images ? 1 : 0) + (videos ? 1 : 0) + (music ? 1 : 0)),
    errors: [],
  });
  const save = () => writeJson(manifestPath(), { ...manifest, generatedAt: new Date().toISOString() });
  const step = (label: string) => {
    progress.done++;
    progress.current = label;
    log(`[${progress.done}/${progress.total}] ${label}`);
  };

  try {
    await pool(voiceLines, 3, async (line) => {
      try {
        const r = await tts(line);
        manifest.voice[textKey(line)] = r.url;
        await save();
      } catch (e) {
        progress.errors.push(`voz "${line.slice(0, 30)}": ${(e as Error).message}`);
      }
      step(`voz: ${line.slice(0, 40)}`);
    });

    await pool(styleJobs, 2, async (s) => {
      const m = (manifest.mascots[s.id] ??= {});
      if (images && !m.image) {
        try {
          m.image = await mascotImage(s.id, s.mascot.prompt);
          await save();
        } catch (e) {
          progress.errors.push(`imagem ${s.id}: ${(e as Error).message}`);
        }
        step(`mascote ${s.mascot.name}`);
      }
      if (music && !manifest.music[s.id]) {
        try {
          const r = await song("", s.id, true);
          manifest.music[s.id] = r.url;
          await save();
        } catch (e) {
          progress.errors.push(`música ${s.id}: ${(e as Error).message}`);
        }
        step(`música ${s.name}`);
      }
      if (videos && !m.video && m.image) {
        try {
          m.video = await mascotVideo(s.id, m.image, publicBase);
          await save();
        } catch (e) {
          progress.errors.push(`vídeo ${s.id}: ${(e as Error).message}`);
        }
        step(`vídeo ${s.mascot.name}`);
      }
    });
    await save();
  } finally {
    progress.running = false;
    progress.finishedAt = new Date().toISOString();
    progress.current = undefined;
  }
  return manifest;
}
