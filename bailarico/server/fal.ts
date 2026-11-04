import { fal } from "@fal-ai/client";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import { hashKey, store, findCached } from "./cache.js";
import { KID_IMAGE_STYLE, MASCOT_IMAGE_STYLE, CLIP_STYLE, KID_VIDEO_PROMPT } from "./safety.js";
import type { MediaResult } from "../shared/types.js";

let configured = false;
function client() {
  if (!config.aiEnabled) throw new Error("fal.ai desligado (FAL_KEY em falta)");
  if (!configured) {
    fal.config({ credentials: config.falKey });
    configured = true;
  }
  return fal;
}

interface FalFile {
  url: string;
  content_type?: string;
}

async function run<T>(model: string, input: Record<string, unknown>): Promise<T> {
  const res = await client().subscribe(model, { input, logs: false });
  return res.data as T;
}

async function image(id: string, prompt: string): Promise<string> {
  const cached = await findCached(id);
  if (cached) return cached;
  const data = await run<{ images: FalFile[] }>(config.models.image, {
    prompt,
    num_images: 1,
    aspect_ratio: "1:1",
    resolution: "1K",
    output_format: "png",
    safety_tolerance: "2",
  });
  const img = data.images?.[0];
  if (!img) throw new Error("O modelo não devolveu imagem.");
  return store(id, img.url, img.content_type);
}

/** O fal precisa de um URL público para a imagem de partida; em local, envia o ficheiro. */
async function publicImageUrl(mediaPath: string, publicBase: string): Promise<string> {
  if (publicBase && !/localhost|127\.0\.0\.1/.test(publicBase)) return publicBase + mediaPath;
  const buf = await fs.readFile(path.join(config.cacheDir, mediaPath.replace(/^\//, "")));
  const ext = path.extname(mediaPath).slice(1);
  return client().storage.upload(new Blob([buf], { type: `image/${ext === "jpg" ? "jpeg" : ext}` }));
}

async function video(id: string, imagePath: string, prompt: string, publicBase: string): Promise<string> {
  const cached = await findCached(id);
  if (cached) return cached;
  const data = await run<{ video: FalFile }>(config.models.video, {
    start_image_url: await publicImageUrl(imagePath, publicBase),
    prompt,
    duration: "5",
    generate_audio: false,
    negative_prompt: "blur, distort, low quality, scary, text, watermark, extra limbs, morphing, camera movement",
  });
  return store(id, data.video.url, data.video.content_type);
}

/* ---------- Estúdio (crianças) ---------- */

export async function dancerImage(description: string): Promise<MediaResult> {
  const id = "img-" + hashKey([config.models.image, 2, description]);
  const cached = await findCached(id);
  if (cached) return { id, url: cached, cached: true };
  const url = await image(id, KID_IMAGE_STYLE.replace("{desc}", description));
  return { id, url, cached: false };
}

export async function animate(imageId: string, publicBase: string): Promise<MediaResult> {
  const id = "vid-" + hashKey([config.models.video, imageId]);
  const cached = await findCached(id);
  if (cached) return { id, url: cached, cached: true };
  const imgPath = await findCached(imageId);
  if (!imgPath) throw new Error("Imagem não encontrada.");
  const url = await video(id, imgPath, KID_VIDEO_PROMPT, publicBase);
  return { id, url, cached: false };
}

/* ---------- Pré-geração (mascotes, clips, música) ---------- */

export async function mascotImage(styleId: string, mascotPrompt: string, artVersion: number): Promise<string> {
  const id = "mascot-" + hashKey([config.models.image, artVersion, styleId, mascotPrompt]);
  return image(id, MASCOT_IMAGE_STYLE.replace("{desc}", mascotPrompt));
}

export async function mascotClip(styleId: string, moveId: string, imagePath: string, motionPrompt: string, publicBase: string): Promise<string> {
  const id = "clip-" + hashKey([config.models.video, styleId, moveId, imagePath, motionPrompt]);
  return video(id, imagePath, `The character ${motionPrompt}. ${CLIP_STYLE}`, publicBase);
}

export async function instrumental(styleId: string, musicPrompt: string): Promise<string> {
  const id = "song-" + hashKey([config.models.instrumental, styleId, musicPrompt]);
  const cached = await findCached(id);
  if (cached) return cached;
  const data = await run<{ audio: FalFile }>(config.models.instrumental, {
    prompt: `${musicPrompt}. Upbeat, happy, instrumental, perfect for children dancing, clear strong beat, loopable.`,
    negative_prompt: "vocals, slow tempo, sad, scary, distorted",
  });
  return store(id, data.audio.url, data.audio.content_type);
}
