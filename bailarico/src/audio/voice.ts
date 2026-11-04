import { ai } from "../lib/ai";
import { generatedVoice } from "../lib/assets";

/**
 * Voz do Bailarico.
 * 1. Se existir voz pré-gerada (fal.ai, public/generated) usa-a.
 * 2. Se o servidor tiver fal.ai ligado, pede TTS (ElevenLabs) e guarda em cache.
 * 3. Caso contrário usa a voz do browser (Web Speech API) em pt-PT.
 */

let current: HTMLAudioElement | null = null;
let muted = false;
const urlCache = new Map<string, string>();

export function setVoiceMuted(m: boolean) {
  muted = m;
  if (m) stopVoice();
}
export function isVoiceMuted() {
  return muted;
}

export function stopVoice() {
  if (current) {
    current.pause();
    current = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function pickPtVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "pt-PT" && /female|joana|catarina|fernanda|google/i.test(v.name)) ||
    voices.find((v) => v.lang === "pt-PT") ||
    voices.find((v) => v.lang.startsWith("pt")) ||
    undefined
  );
}

function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-PT";
    u.rate = 1.02;
    u.pitch = 1.15;
    const v = pickPtVoice();
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
}

function playUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    stopVoice();
    const a = new Audio(url);
    current = a;
    a.onended = () => resolve();
    a.onerror = () => resolve();
    a.play().catch(() => resolve());
  });
}

export async function speak(text: string): Promise<void> {
  if (muted || !text) return;
  const pre = generatedVoice(text);
  if (pre) return playUrl(pre);
  if (ai.status?.features.tts) {
    try {
      let url = urlCache.get(text);
      if (!url) {
        const r = await ai.tts(text);
        url = r.url;
        urlCache.set(text, url);
      }
      return playUrl(url);
    } catch {
      // cai para a voz do browser
    }
  }
  return speakBrowser(text);
}

/** Pré-carrega frases (quando há TTS no servidor) para não haver pausas. */
export function warmup(texts: string[]) {
  if (!ai.status?.features.tts) return;
  texts.forEach((t) => {
    if (urlCache.has(t) || generatedVoice(t)) return;
    ai.tts(t)
      .then((r) => urlCache.set(t, r.url))
      .catch(() => undefined);
  });
}
