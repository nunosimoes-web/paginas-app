import { ai } from "../lib/ai";
import { generatedVoice } from "../lib/assets";
import { getDict } from "../../shared/i18n/index.js";
import type { Locale } from "../../shared/types.js";

/**
 * Voz do Bailarico, por língua.
 * 1. Voz pré-gerada (manifesto) → 2. TTS do servidor (Gemini pt-PT / ElevenLabs en) → 3. voz do browser,
 *    mas só se existir uma voz EXATAMENTE da língua certa (nunca pt-BR para pt-PT).
 */

let current: HTMLAudioElement | null = null;
let muted = false;
let locale: Locale = "pt-PT";
const urlCache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

/** No máximo 2 pedidos de voz em simultâneo ao servidor, para não bloquear as outras ligações do browser. */
const MAX_INFLIGHT = 2;
let inflight = 0;
const waiting: (() => void)[] = [];
async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (inflight >= MAX_INFLIGHT) await new Promise<void>((r) => waiting.push(r));
  inflight++;
  try {
    return await fn();
  } finally {
    inflight--;
    waiting.shift()?.();
  }
}

/** Pede (ou reutiliza) o URL de uma frase; um único pedido por frase mesmo com chamadas repetidas. */
function fetchVoiceUrl(text: string, timeoutMs: number): Promise<string> {
  const key = `${locale}:${text}`;
  const hit = urlCache.get(key);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(key);
  if (!p) {
    const l = locale;
    p = withSlot(() =>
      Promise.race([
        ai.tts(text, l).then((r) => r.url),
        new Promise<string>((_, rej) => setTimeout(() => rej(new Error("tts timeout")), timeoutMs)),
      ]),
    )
      .then((url) => {
        urlCache.set(key, url);
        return url;
      })
      .finally(() => pending.delete(key));
    pending.set(key, p);
  }
  return p;
}

export function setVoiceLocale(l: Locale) {
  locale = l;
}
export function setVoiceMuted(m: boolean) {
  muted = m;
  if (m) stopVoice();
}
export const isVoiceMuted = () => muted;

export function stopVoice() {
  if (current) {
    current.pause();
    current = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function browserVoice(): SpeechSynthesisVoice | undefined {
  const want = getDict(locale).speechLang.toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === want);
  if (exact.length) return exact.find((v) => /female|joana|catarina|fernanda|google|natural/i.test(v.name)) ?? exact[0];
  if (locale === "en") return voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return undefined; // pt-PT: sem voz de Portugal, melhor ficar em silêncio do que falar com outro sotaque
}

function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    const v = browserVoice();
    if (!v) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v;
    u.lang = v.lang;
    u.rate = 1.02;
    u.pitch = 1.1;
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
  const pre = generatedVoice(locale, text);
  if (pre) return playUrl(pre);
  if (ai.status?.features.tts?.[locale]) {
    try {
      return await playUrl(await fetchVoiceUrl(text, 12_000));
    } catch {
      /* cai para o browser */
    }
  }
  return speakBrowser(text);
}

/** Pede ao servidor as frases com antecedência (quando há TTS) para não haver pausas. */
export function warmup(texts: string[]) {
  if (!ai.status?.features.tts?.[locale]) return;
  texts.slice(0, 8).forEach((t) => {
    if (generatedVoice(locale, t)) return;
    fetchVoiceUrl(t, 60_000).catch(() => undefined);
  });
}
