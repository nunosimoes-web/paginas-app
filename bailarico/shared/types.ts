// Tipos partilhados entre o browser e o servidor.

export type StyleId = "robo" | "hiphop" | "ballet" | "festa" | "disco";

export interface AiStatus {
  enabled: boolean;
  features: {
    image: boolean;
    video: boolean;
    tts: boolean;
    music: boolean;
  };
  quotas: {
    imagesLeft: number;
    videosLeft: number;
    songsLeft: number;
  };
}

export interface MediaResult {
  id: string;
  url: string;
  cached: boolean;
}

export interface DancerRequest {
  description: string;
}

export interface AnimateRequest {
  imageId: string;
}

export interface SongRequest {
  name: string;
  style: StyleId;
  instrumental?: boolean;
}

export interface TtsRequest {
  text: string;
}

export interface ApiError {
  error: string;
  friendly: string;
}

/** Manifesto produzido por `npm run generate-assets` (public/generated/manifest.json). */
export interface GeneratedManifest {
  generatedAt: string;
  mascots: Partial<Record<StyleId, { image?: string; video?: string }>>;
  music: Partial<Record<StyleId, string>>;
  voice: Record<string, string>; // hash(texto) -> url relativa
}
