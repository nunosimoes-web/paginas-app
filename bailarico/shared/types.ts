// Tipos partilhados entre o browser e o servidor.

export type StyleId = "robo" | "hiphop" | "ballet" | "festa" | "disco";
export type Locale = "pt-PT" | "en";
export const LOCALES: Locale[] = ["pt-PT", "en"];
export const DEFAULT_LOCALE: Locale = "pt-PT";

export interface AiStatus {
  enabled: boolean;
  features: {
    image: boolean;
    video: boolean;
    /** vozes disponíveis por língua */
    tts: Partial<Record<Locale, boolean>>;
    music: boolean;
  };
  quotas: {
    imagesLeft: number;
    videosLeft: number;
  };
}

export interface MediaResult {
  id: string;
  url: string;
  cached: boolean;
}

export interface ApiError {
  error: string;
  friendly: string;
}

/** Manifesto produzido pela pré-geração (servido em /generated/manifest.json). */
export interface GeneratedManifest {
  generatedAt: string;
  /** versão do estilo visual; muda quando os prompts mudam para forçar regeneração */
  artVersion: number;
  mascots: Partial<Record<StyleId, { image?: string; idle?: string }>>;
  /** imagem de capa com os cinco professores juntos */
  hero?: string;
  /** clips de vídeo por estilo e por passo */
  clips: Partial<Record<StyleId, Record<string, string>>>;
  music: Partial<Record<StyleId, string>>;
  /** vozes por língua: hash(texto) -> url */
  voice: Partial<Record<Locale, Record<string, string>>>;
}
