/**
 * Detetor de movimento pela câmara (sem bibliotecas): compara frames
 * reduzidos e devolve a "energia" (0..1). Nada sai do dispositivo —
 * a imagem nunca é enviada para servidor nenhum.
 */
export class MotionDetector {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private canvas = document.createElement("canvas");
  private ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;
  private prev: Uint8ClampedArray | null = null;
  private raf = 0;
  private smooth = 0;
  energy = 0;
  active = false;
  onEnergy: ((e: number) => void) | null = null;

  constructor(private w = 48, private h = 36) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  static supported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  }

  async start(videoEl: HTMLVideoElement): Promise<boolean> {
    if (!MotionDetector.supported()) return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
    } catch {
      return false;
    }
    this.video = videoEl;
    videoEl.srcObject = this.stream;
    videoEl.muted = true;
    videoEl.playsInline = true;
    await videoEl.play().catch(() => undefined);
    this.active = true;
    this.loop();
    return true;
  }

  stop() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
    this.prev = null;
    this.energy = 0;
    this.smooth = 0;
  }

  private loop = () => {
    if (!this.active || !this.video) return;
    if (this.video.readyState >= 2) {
      this.ctx.drawImage(this.video, 0, 0, this.w, this.h);
      const cur = this.ctx.getImageData(0, 0, this.w, this.h).data;
      if (this.prev) {
        let diff = 0;
        let moved = 0;
        for (let i = 0; i < cur.length; i += 4) {
          const d =
            Math.abs(cur[i] - this.prev[i]) + Math.abs(cur[i + 1] - this.prev[i + 1]) + Math.abs(cur[i + 2] - this.prev[i + 2]);
          if (d > 60) moved++;
          diff += d;
        }
        const pixels = cur.length / 4;
        // combina fração de píxeis em movimento com intensidade média
        const raw = Math.min(1, (moved / pixels) * 6 + (diff / pixels / 765) * 2);
        this.smooth = this.smooth * 0.7 + raw * 0.3;
        this.energy = this.smooth;
        this.onEnergy?.(this.energy);
      }
      this.prev = new Uint8ClampedArray(cur);
    }
    this.raf = requestAnimationFrame(this.loop);
  };
}
