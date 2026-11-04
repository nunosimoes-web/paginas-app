import type { AiStatus, MediaResult, StyleId } from "../../shared/types";

/** Cliente do servidor /api (fal.ai por trás). Falha com elegância quando não há servidor. */
class AiClient {
  status: AiStatus | null = null;
  private loading: Promise<AiStatus | null> | null = null;

  async load(): Promise<AiStatus | null> {
    if (this.status) return this.status;
    if (!this.loading) {
      this.loading = fetch("api/ai/status", { cache: "no-store" })
        .then(async (r) => (r.ok ? ((await r.json()) as AiStatus) : null))
        .catch(() => null)
        .then((s) => {
          this.status = s;
          return s;
        });
    }
    return this.loading;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(`api/ai/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await r.json().catch(() => ({}))) as T & { friendly?: string; error?: string };
    if (!r.ok) throw new Error(data.friendly || data.error || "Algo correu mal.");
    return data;
  }

  tts(text: string) {
    return this.post<MediaResult>("tts", { text });
  }
  dancer(description: string) {
    return this.post<MediaResult>("dancer", { description });
  }
  animate(imageId: string) {
    return this.post<MediaResult>("animate", { imageId });
  }
  song(name: string, style: StyleId, instrumental = false) {
    return this.post<MediaResult>("song", { name, style, instrumental });
  }
  async refreshStatus() {
    this.status = null;
    this.loading = null;
    return this.load();
  }
}

export const ai = new AiClient();
