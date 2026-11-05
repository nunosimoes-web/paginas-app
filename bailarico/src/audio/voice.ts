import { ai } from "../lib/ai";
import { generatedVoice } from "../lib/assets";
import { getDict } from "../../shared/i18n/index.js";
import type { Locale } from "../../shared/types.js";
import { audioContext } from "./context";

/**
 * Voz do DanceLab.
 * - Frases faladas: elemento <audio> pré-carregado (toca em tablets mesmo em modo silencioso, sem atraso).
 * - Contagem "um, dois, três": Web Audio, para cair exatamente em cima do tempo da música.
 * - Origem: voz pré-gerada (manifesto) → voz do servidor → voz do browser (só se for da língua exata
 *   e o servidor não tiver voz para essa língua; nunca português do Brasil no lugar de Portugal).
 * - stopVoice() é chamado pelo router ANTES de o ecrã novo aparecer, por isso o ecrã novo pode falar.
 */

let muted = false;
let locale: Locale = "pt-PT";
let generation = 0;
let current: { stop: () => void } | null = null;
const urlCache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
const elements = new Map<string, HTMLAudioElement>();
const buffers = new Map<string, AudioBuffer>();
const decoding = new Map<string, Promise<AudioBuffer | null>>();

export function setVoiceLocale(l: Locale) {
  locale = l;
}
export function setVoiceMuted(m: boolean) {
  muted = m;
  if (m) stopVoice();
}
export const isVoiceMuted = () => muted;

export function stopVoice() {
  generation++;
  current?.stop();
  current = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

const hasServerVoice = () => !!ai.status?.features.tts?.[locale];

/** URL do áudio de uma frase (manifesto, cache ou servidor). null = não há voz de servidor. */
function voiceUrl(text: string, timeoutMs: number): Promise<string> | null {
  const pre = generatedVoice(locale, text);
  if (pre) return Promise.resolve(pre);
  if (!hasServerVoice()) return null;
  const key = `${locale}:${text}`;
  const hit = urlCache.get(key);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(key);
  if (!p) {
    const l = locale;
    p = Promise.race([
      ai.tts(text, l).then((r) => r.url),
      new Promise<string>((_, rej) => setTimeout(() => rej(new Error("tts timeout")), timeoutMs)),
    ])
      .then((url) => {
        urlCache.set(key, url);
        return url;
      })
      .finally(() => pending.delete(key));
    pending.set(key, p);
  }
  return p;
}

function elementFor(url: string): HTMLAudioElement {
  let a = elements.get(url);
  if (!a) {
    a = new Audio(url);
    a.preload = "auto";
    a.setAttribute("playsinline", "");
    elements.set(url, a);
  }
  return a;
}

function playElement(a: HTMLAudioElement): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      a.removeEventListener("ended", finish);
      a.removeEventListener("error", finish);
      resolve();
    };
    a.addEventListener("ended", finish);
    a.addEventListener("error", finish);
    try {
      a.currentTime = 0;
    } catch {
      /* ainda a carregar */
    }
    a.play().catch(finish);
    current = {
      stop: () => {
        a.pause();
        finish();
      },
    };
  });
}

function browserVoice(): SpeechSynthesisVoice | undefined {
  const want = getDict(locale).speechLang.toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === want);
  if (exact.length) return exact.find((v) => /female|joana|catarina|google|natural/i.test(v.name)) ?? exact[0];
  if (locale === "en") return voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return undefined;
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
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    current = { stop: () => window.speechSynthesis.cancel() };
  });
}

/** Diz uma frase (interrompe a anterior). Resolve quando acaba ou é cancelada. */
export async function speak(text: string): Promise<void> {
  if (muted || !text) return;
  const gen = ++generation;
  current?.stop();
  current = null;
  const urlP = voiceUrl(text, 15_000);
  if (!urlP) return speakBrowser(text);
  let url: string;
  try {
    url = await urlP;
  } catch {
    return; // há voz de qualidade no servidor mas esta frase falhou: silêncio, nunca voz robótica
  }
  if (gen !== generation) return;
  return playElement(elementFor(url));
}

/* ---------- contagem em cima do tempo (Web Audio) ---------- */
async function bufferFor(text: string): Promise<AudioBuffer | null> {
  const urlP = voiceUrl(text, 60_000);
  if (!urlP) return null;
  const url = await urlP.catch(() => null);
  if (!url) return null;
  const hit = buffers.get(url);
  if (hit) return hit;
  let d = decoding.get(url);
  if (!d) {
    d = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((ab) => audioContext().decodeAudioData(ab))
      .then((buf) => {
        buffers.set(url, buf);
        return buf;
      })
      .catch(() => null)
      .finally(() => decoding.delete(url));
    decoding.set(url, d);
  }
  return d;
}

/** Diz uma palavra curta por cima do que estiver a tocar, num instante exato. false = ainda não está carregada. */
export function speakAt(text: string, when = 0): boolean {
  if (muted) return false;
  const url = generatedVoice(locale, text) ?? urlCache.get(`${locale}:${text}`);
  const buf = url ? buffers.get(url) : undefined;
  if (!buf) {
    void bufferFor(text);
    return false;
  }
  const c = audioContext();
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.start(Math.max(when, c.currentTime));
  return true;
}

/** Pré-carrega frases (as frases para <audio>, a contagem para Web Audio). */
export function warmup(texts: string[], counts: string[] = []) {
  texts.slice(0, 40).forEach((t) => {
    const p = voiceUrl(t, 60_000);
    p?.then((url) => elementFor(url).load()).catch(() => undefined);
  });
  counts.forEach((c) => void bufferFor(c));
}
