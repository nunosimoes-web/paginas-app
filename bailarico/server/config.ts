import "dotenv/config";
import path from "node:path";

const env = (k: string, d = "") => (process.env[k] ?? d).trim();

export const config = {
  port: Number(env("PORT", "3000")),
  falKey: env("FAL_KEY"),
  adminKey: env("ADMIN_KEY"),
  cacheDir: path.resolve(env("CACHE_DIR", "./cache")),
  models: {
    image: env("AI_IMAGE_MODEL", "fal-ai/nano-banana-2"),
    video: env("AI_VIDEO_MODEL", "fal-ai/kling-video/v3/standard/image-to-video"),
    tts: env("AI_TTS_MODEL", "fal-ai/elevenlabs/tts/multilingual-v2"),
    ttsVoice: env("AI_TTS_VOICE", "Matilda"),
    music: env("AI_MUSIC_MODEL", "fal-ai/minimax-music/v2.6"),
    instrumental: env("AI_INSTRUMENTAL_MODEL", "fal-ai/lyria2"),
  },
  quotas: {
    images: Number(env("AI_MAX_IMAGES_PER_DAY", "60")),
    videos: Number(env("AI_MAX_VIDEOS_PER_DAY", "12")),
    songs: Number(env("AI_MAX_SONGS_PER_DAY", "20")),
  },
  get aiEnabled() {
    return this.falKey.length > 0;
  },
};
