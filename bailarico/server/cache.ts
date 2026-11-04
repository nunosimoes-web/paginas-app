import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";

/**
 * Cache em disco dos ficheiros gerados pelo fal.ai. Os URLs do fal expiram,
 * por isso descarregamos tudo para `cache/` e servimos em /media/<id>.<ext>.
 */

export function hashKey(parts: unknown[]): string {
  return crypto.createHash("sha1").update(JSON.stringify(parts)).digest("hex").slice(0, 20);
}

/** Mesmo FNV-1a de src/lib/assets.ts — para indexar vozes pré-geradas pelo texto. */
export function textKey(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export async function ensureDirs() {
  await fs.mkdir(path.join(config.cacheDir, "media"), { recursive: true });
  await fs.mkdir(path.join(config.cacheDir, "generated"), { recursive: true });
}

export const mediaDir = () => path.join(config.cacheDir, "media");
export const generatedDir = () => path.join(config.cacheDir, "generated");

export async function findCached(id: string): Promise<string | null> {
  const files = await fs.readdir(mediaDir()).catch(() => [] as string[]);
  const f = files.find((n) => n.startsWith(id + "."));
  return f ? `/media/${f}` : null;
}

function extFor(url: string, contentType?: string): string {
  const fromUrl = path.extname(new URL(url).pathname).replace(".", "").toLowerCase();
  if (fromUrl && fromUrl.length <= 4) return fromUrl;
  if (contentType?.includes("mpeg") || contentType?.includes("mp3")) return "mp3";
  if (contentType?.includes("wav")) return "wav";
  if (contentType?.includes("mp4")) return "mp4";
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("jpeg")) return "jpg";
  if (contentType?.includes("webp")) return "webp";
  return "bin";
}

/** Descarrega um URL do fal e guarda como <id>.<ext>; devolve o caminho público. */
export async function store(id: string, url: string, contentType?: string): Promise<string> {
  const existing = await findCached(id);
  if (existing) return existing;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Falha ao descarregar ficheiro gerado (${r.status})`);
  const ext = extFor(url, contentType || r.headers.get("content-type") || undefined);
  const file = `${id}.${ext}`;
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(path.join(mediaDir(), file), buf);
  return `/media/${file}`;
}

export async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}
