import { ai } from "../lib/ai";
import { generatedVoice } from "../lib/assets";
import { getDict } from "../../shared/i18n/index.js";
import type { Locale } from "../../shared/types.js";
import { audioContext } from "./context";

/**
 * Voz do DanceLab, por língua.
 * 1. Voz pré-gerada (manifesto) → 2. TTS do servidor (Gemini pt-PT / ElevenLabs en) → 3. voz do browser,
 *    mas só se existir uma voz EXATAMENTE da língua certa (nunca pt-BR para pt-PT) e só quando o servidor não tem voz.
 *
 * Sem atrasos: as frases são descarregadas e descodificadas com antecedência (VoiceBank) e tocadas pelo
 * WebAudio, com precisão de milissegundos (a contagem "um, dois, três, quatro" cai em cima do tempo).
 * Ao mudar de ecrã, `stopVoice()` cancela tudo o que estava a tocar ou à espera.
 */

let muted = false;
let locale: Locale = "pt-PT";
let generation = 0; // sobe a cada stopVoice(): pedidos antigos deixam de tocar
let current: { stop: () => void } | null = null;
const urlCache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
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

/** Para a voz atual e invalida tudo o que ainda não começou a tocar. */
export function stopVoice() {
  generation++;
  current?.stop();
  current = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

/* ---------- pedidos ao servidor (máx. 2 em simultâneo) ---------- */
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

/** URL do áudio de uma frase: manifesto, cache, ou pedido ao servidor. */
function voiceUrl(text: string, timeoutMs: number): Promise<string> | null {
  const pre = generatedVoice(locale, text);
  if (pre) return Promise.resolve(pre);
  if (!ai.status?.features.tts?.[locale]) return null;
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

/** Descarrega e descodifica uma frase para tocar sem atraso. */
async function bufferFor(text: string, timeoutMs = 20_000): Promise<AudioBuffer | null> {
  const urlP = voiceUrl(text, timeoutMs);
  if (!urlP) return null;
  const url = await urlP;
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

function playBuffer(buf: AudioBuffer, when = 0): Promise<void> {
  return new Promise((resolve) => {
    const ctx = audioContext();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 1;
    src.connect(g).connect(ctx.destination);
    src.onended = () => resolve();
    src.start(when || ctx.currentTime);
    current = {
      stop: () => {
        try {
          src.stop();
        } catch {
          /* já parou */
        }
        resolve();
      },
    };
  });
}

function browserVoice(): SpeechSynthesisVoice | undefined {
  const want = getDict(locale).speechLang.toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === want);
  if (exact.length) return exact.find((v) => /female|joana|catarina|fernanda|google|natural/i.test(v.name)) ?? exact[0];
  if (locale === "en") return voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return undefined; // pt-PT: sem voz de Portugal, melhor silêncio do que outro sotaque
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
    current = { stop: () => window.speechSynthesis.cancel() };
  });
}

/** Diz uma frase (interrompe a anterior). Resolve quando acaba ou é cancelada. */
export async function speak(text: string): Promise<void> {
  if (muted || !text) return;
  const gen = ++generation;
  current?.stop();
  current = null;
  const hasServerVoice = !!generatedVoice(locale, text) || !!ai.status?.features.tts?.[locale];
  if (hasServerVoice) {
    const buf = await bufferFor(text);
    if (gen !== generation) return; // entretanto mudámos de ecrã ou de frase
    if (buf) return playBuffer(buf);
    return; // há voz boa no servidor mas falhou: silêncio, nunca voz robótica
  }
  return speakBrowser(text);
}

/** Diz uma frase curta por cima da atual, sem a interromper (ex.: contagem). Só se já estiver carregada. */
export function speakOver(text: string, when = 0): boolean {
  if (muted) return false;
  const url = generatedVoice(locale, text) ?? urlCache.get(`${locale}:${text}`);
  const buf = url ? buffers.get(url) : undefined;
  if (!buf) {
    void bufferFor(text);
    return false;
  }
  const ctx = audioContext();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(when || ctx.currentTime);
  return true;
}

/** Pré-carrega frases para tocarem sem atraso. */
export function warmup(texts: string[]) {
  texts.slice(0, 40).forEach((t) => void bufferFor(t, 60_000));
}
