import "dotenv/config";
import path from "node:path";
import type { Locale } from "../shared/types.js";

const env = (k: string, d = "") => (process.env[k] ?? d).trim();

/** Fornecedor de voz por língua. pt-PT usa Gemini TTS (único com sotaque de Portugal verificado). */
export type TtsProvider = { kind: "gemini"; model: string; voice: string; languageCode: string } | { kind: "elevenlabs"; model: string; voice: string; languageCode: string };

export const config = {
  port: Number(env("PORT", "3000")),
  falKey: env("FAL_KEY"),
  geminiKey: env("GEMINI_API_KEY"),
  adminKey: env("ADMIN_KEY"),
  cacheDir: path.resolve(env("CACHE_DIR", "./cache")),
  models: {
    image: env("AI_IMAGE_MODEL", "fal-ai/nano-banana-2"),
    video: env("AI_VIDEO_MODEL", "fal-ai/kling-video/v3/standard/image-to-video"),
    instrumental: env("AI_INSTRUMENTAL_MODEL", "fal-ai/lyria2"),
  },
  tts: {
    "pt-PT": { kind: "gemini", model: env("AI_TTS_GEMINI_MODEL", "gemini-3.8-flash-tts"), voice: env("AI_TTS_PT_VOICE", "Leda"), languageCode: "pt-PT" },
    en: { kind: "elevenlabs", model: env("AI_TTS_ELEVEN_MODEL", "fal-ai/elevenlabs/tts/multilingual-v2"), voice: env("AI_TTS_EN_VOICE", "Matilda"), languageCode: "en" },
  } as Record<Locale, TtsProvider>,
  quotas: {
    images: Number(env("AI_MAX_IMAGES_PER_DAY", "60")),
    videos: Number(env("AI_MAX_VIDEOS_PER_DAY", "12")),
  },
  get aiEnabled() {
    return this.falKey.length > 0;
  },
  ttsEnabled(locale: Locale): boolean {
    const p = this.tts[locale];
    if (!p) return false;
    return p.kind === "gemini" ? this.geminiKey.length > 0 : this.falKey.length > 0;
  },
};
