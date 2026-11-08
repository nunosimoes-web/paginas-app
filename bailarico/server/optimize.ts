import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { config } from "./config.js";
import { loadManifest, manifestPath } from "./generate.js";
import { writeJson } from "./cache.js";
import type { GeneratedManifest } from "../shared/types.js";

const exec = promisify(execFile);

/**
 * Versões leves para tablets e telemóveis (os originais ficam guardados):
 * - vídeos dos passos: 540×540, H.264, ~0,5 MB em vez de ~7 MB, a começar a tocar logo (faststart);
 * - imagens: JPEG (professores 640 px, capa 1280 px), ~0,1 MB em vez de ~1,5 MB;
 * - músicas: MP3 128 kbps em vez de WAV.
 */
export const optProgress = { running: false, done: 0, total: 0, errors: [] as string[], savedMB: 0 };

const local = (url: string) => path.join(config.cacheDir, url.replace(/^\//, ""));
const swapExt = (url: string, ext: string) => url.replace(/\.[a-z0-9]+$/i, ext);
async function size(file: string) {
  return (await fs.stat(file).catch(() => null))?.size ?? 0;
}

async function convert(url: string, outExt: string, args: (inp: string, out: string) => string[]): Promise<string> {
  if (url.endsWith(outExt)) return url;
  const out = swapExt(url, outExt);
  if ((await size(local(out))) > 0) return out;
  const tmp = local(out) + ".tmp" + path.extname(out);
  await exec("ffmpeg", ["-loglevel", "error", "-y", ...args(local(url), tmp)], { timeout: 180_000 });
  await fs.rename(tmp, local(out));
  optProgress.savedMB += ((await size(local(url))) - (await size(local(out)))) / 1e6;
  return out;
}

const video = (url: string) =>
  convert(url, ".s.mp4", (i, o) => [
    "-i", i, "-an", "-vf", "scale=540:540:flags=lanczos", "-c:v", "libx264", "-profile:v", "main", "-preset", "medium",
    "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", o,
  ]);
const image = (url: string, width: number) => convert(url, ".jpg", (i, o) => ["-i", i, "-vf", `scale=${width}:-2:flags=lanczos`, "-q:v", "4", o]);
const audio = (url: string) => convert(url, ".mp3", (i, o) => ["-i", i, "-c:a", "libmp3lame", "-b:a", "128k", o]);

export async function optimizeAll(log: (s: string) => void = console.log): Promise<GeneratedManifest> {
  if (optProgress.running) throw new Error("Otimização já em curso");
  const m = await loadManifest();
  const jobs: { label: string; run: () => Promise<void> }[] = [];
  for (const [style, entry] of Object.entries(m.mascots)) {
    if (entry?.image) jobs.push({ label: `imagem ${style}`, run: async () => void (entry.image = await image(entry.image!, 640)) });
    if (entry?.idle) jobs.push({ label: `vídeo boas-vindas ${style}`, run: async () => void (entry.idle = await video(entry.idle!)) });
  }
  if (m.hero) jobs.push({ label: "capa", run: async () => void (m.hero = await image(m.hero!, 1280)) });
  for (const [style, clips] of Object.entries(m.clips)) {
    for (const move of Object.keys(clips ?? {})) {
      jobs.push({ label: `vídeo ${style}/${move}`, run: async () => void (clips![move] = await video(clips![move])) });
    }
  }
  for (const style of Object.keys(m.music)) {
    const key = style as keyof typeof m.music;
    jobs.push({ label: `música ${style}`, run: async () => void (m.music[key] = await audio(m.music[key]!)) });
  }
  Object.assign(optProgress, { running: true, done: 0, total: jobs.length, errors: [], savedMB: 0 });
  try {
    for (const j of jobs) {
      try {
        await j.run();
      } catch (e) {
        optProgress.errors.push(`${j.label}: ${(e as Error).message.slice(0, 200)}`);
      }
      optProgress.done++;
      log(`[otimizar ${optProgress.done}/${optProgress.total}] ${j.label}`);
    }
    await writeJson(manifestPath(), { ...m, generatedAt: new Date().toISOString() });
  } finally {
    optProgress.running = false;
  }
  return m;
}
