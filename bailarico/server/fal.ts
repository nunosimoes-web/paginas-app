import { fal } from "@fal-ai/client";
import { config } from "./config.js";
import { hashKey, store, findCached } from "./cache.js";
import { KID_IMAGE_STYLE, KID_VIDEO_PROMPT } from "./safety.js";
import type { StyleId, MediaResult } from "../shared/types.js";

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

/** Voz (ElevenLabs multilingual, pt). */
export async function tts(text: string): Promise<MediaResult> {
  const id = "tts-" + hashKey([config.models.tts, config.models.ttsVoice, text]);
  const cached = await findCached(id);
  if (cached) return { id, url: cached, cached: true };
  const data = await run<{ audio: FalFile }>(config.models.tts, {
    text,
    voice: config.models.ttsVoice,
    language_code: "pt",
    stability: 0.45,
    similarity_boost: 0.8,
    style: 0.6,
    speed: 1.0,
  });
  const url = await store(id, data.audio.url, data.audio.content_type);
  return { id, url, cached: false };
}

/** Imagem de um dançarino a partir da descrição de uma criança (já higienizada). */
export async function dancerImage(description: string): Promise<MediaResult> {
  const id = "img-" + hashKey([config.models.image, description]);
  const cached = await findCached(id);
  if (cached) return { id, url: cached, cached: true };
  const prompt = KID_IMAGE_STYLE.replace("{desc}", description);
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
  const url = await store(id, img.url, img.content_type);
  return { id, url, cached: false };
}

/** Imagem -> vídeo curto (5 s) do dançarino a dançar. */
export async function animate(imageId: string, publicBase: string): Promise<MediaResult> {
  const id = "vid-" + hashKey([config.models.video, imageId]);
  const cached = await findCached(id);
  if (cached) return { id, url: cached, cached: true };
  const imgPath = await findCached(imageId);
  if (!imgPath) throw new Error("Imagem não encontrada.");
  // O fal precisa de um URL público; se o servidor não for público, enviamos o ficheiro.
  let imageUrl = publicBase ? publicBase + imgPath : "";
  if (!imageUrl || /localhost|127\.0\.0\.1/.test(imageUrl)) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const buf = await fs.readFile(path.join(config.cacheDir, imgPath.replace(/^\/media\//, "media/")));
    const ext = path.extname(imgPath).slice(1);
    const blob = new Blob([buf], { type: `image/${ext === "jpg" ? "jpeg" : ext}` });
    imageUrl = await client().storage.upload(blob);
  }
  const data = await run<{ video: FalFile }>(config.models.video, {
    start_image_url: imageUrl,
    prompt: KID_VIDEO_PROMPT,
    duration: "5",
    generate_audio: false,
    negative_prompt: "blur, distort, low quality, scary, text, watermark",
  });
  const url = await store(id, data.video.url, data.video.content_type);
  return { id, url, cached: false };
}

const STYLE_MUSIC: Record<StyleId, { genre: string; lyricsStyle: string }> = {
  robo: { genre: "playful electronic robot funk, 100 bpm, chiptune synths, vocoder effects, kids party", lyricsStyle: "robótica, com bips e bops" },
  hiphop: { genre: "fun kid-friendly old school hip hop, 92 bpm, boom bap drums, funky bass, hand claps", lyricsStyle: "rap divertido e positivo" },
  ballet: { genre: "gentle magical waltz, 3/4 time, 96 bpm, music box, strings, dreamy and sparkly", lyricsStyle: "suave e mágica" },
  festa: { genre: "joyful tropical samba carnival, 108 bpm, surdo drums, tamborim, brass, whistles, party", lyricsStyle: "festiva e cheia de alegria" },
  disco: { genre: "sparkly 70s disco for kids, 118 bpm, four on the floor, funky guitar, strings, hand claps", lyricsStyle: "disco brilhante" },
};

/** Música personalizada com o nome da criança (MiniMax Music) ou instrumental (Lyria 2). */
export async function song(name: string, style: StyleId, instrumental: boolean): Promise<MediaResult> {
  const info = STYLE_MUSIC[style];
  const model = instrumental ? config.models.instrumental : config.models.music;
  const id = "song-" + hashKey([model, style, instrumental ? "" : name]);
  const cached = await findCached(id);
  if (cached) return { id, url: cached, cached: true };

  let data: { audio: FalFile };
  if (instrumental) {
    data = await run<{ audio: FalFile }>(model, {
      prompt: `${info.genre}. Upbeat, happy, instrumental, perfect for children dancing, clear strong beat, loopable.`,
      negative_prompt: "vocals, slow tempo, sad, scary, distorted",
    });
  } else {
    const lyrics = [
      "[Intro]",
      `Olá ${name}, olá ${name}!`,
      "[Verse]",
      `${name} chegou para dançar,`,
      "braços no ar, pés a saltar,",
      "um, dois, três, vamos lá,",
      `ninguém dança como ${name} dança!`,
      "[Chorus]",
      "Bailarico, bailarico,",
      "mexe o corpo, é tão rico,",
      `${name} brilha, ${name} voa,`,
      "a dançar a vida é boa!",
      "[Outro]",
      `Boa, ${name}! Que estrela!`,
    ].join("\n");
    data = await run<{ audio: FalFile }>(model, {
      prompt: `${info.genre}. Happy children's song in European Portuguese, ${info.lyricsStyle}, cheerful female singer, sing-along chorus, about 60 seconds.`,
      lyrics,
      is_instrumental: false,
    });
  }
  const url = await store(id, data.audio.url, data.audio.content_type);
  return { id, url, cached: false };
}
