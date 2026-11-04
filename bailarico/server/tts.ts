import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fal } from "@fal-ai/client";
import { config } from "./config.js";
import { hashKey, findCached, mediaDir, store } from "./cache.js";
import type { Locale, MediaResult } from "../shared/types.js";

const exec = promisify(execFile);
let falConfigured = false;

/** Fila série para o Gemini (limites de pedidos por minuto apertados) com repetição em 429/503. */
let geminiChain: Promise<unknown> = Promise.resolve();
function geminiQueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = geminiChain.then(fn, fn);
  geminiChain = run.catch(() => undefined);
  return run;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geminiGenerate(model: string, body: unknown): Promise<Response> {
  let delay = 4000;
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.status !== 429 && r.status !== 503) return r;
    const text = await r.text();
    const retry = /"retryDelay":\s*"(\d+)s"/.exec(text);
    const wait = retry ? Number(retry[1]) * 1000 + 500 : delay;
    if (attempt === 5) return new Response(text, { status: r.status });
    await sleep(wait);
    delay = Math.min(delay * 2, 60_000);
  }
  throw new Error("unreachable");
}

/**
 * Voz por língua.
 * - pt-PT: Gemini TTS com languageCode "pt-PT" (texto puro, sem instruções, para o modelo não as ler em voz alta).
 *   Foi o único fornecedor cuja pronúncia passou numa avaliação fonética de português europeu.
 * - en: ElevenLabs (via fal.ai).
 * O áudio fica em cache em disco; o mesmo texto nunca é pedido duas vezes.
 */
export async function synthesize(text: string, locale: Locale): Promise<MediaResult> {
  const p = config.tts[locale];
  if (!p) throw new Error(`Sem voz para ${locale}`);
  const id = `tts-${locale}-` + hashKey([p.kind, p.model, p.voice, text]);
  const cached = await findCached(id);
  if (cached) return { id, url: cached, cached: true };

  if (p.kind === "gemini") {
    const body = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { languageCode: p.languageCode, voiceConfig: { prebuiltVoiceConfig: { voiceName: p.voice } } },
      },
    };
    const r = await geminiQueue(() => geminiGenerate(p.model, body));
    if (!r.ok) throw new Error(`Gemini TTS ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const data = (await r.json()) as { candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[] };
    const part = data.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
    if (!part?.inlineData) throw new Error("Gemini TTS não devolveu áudio");
    const buf = Buffer.from(part.inlineData.data, "base64");
    const mime = part.inlineData.mimeType;
    const url = await saveAudio(id, buf, mime);
    return { id, url, cached: false };
  }

  if (!falConfigured) {
    fal.config({ credentials: config.falKey });
    falConfigured = true;
  }
  const res = await fal.subscribe(p.model, {
    input: { text, voice: p.voice, language_code: p.languageCode, stability: 0.45, similarity_boost: 0.8, style: 0.5, speed: 1.0 },
  });
  const audio = (res.data as { audio: { url: string; content_type?: string } }).audio;
  const url = await store(id, audio.url, audio.content_type);
  return { id, url, cached: false };
}

/** Guarda áudio bruto; converte PCM/WAV para MP3 se houver ffmpeg (ficheiros 8x mais pequenos). */
async function saveAudio(id: string, buf: Buffer, mime: string): Promise<string> {
  const isPcm = /L16|pcm/i.test(mime);
  const rate = /rate=(\d+)/.exec(mime)?.[1] ?? "24000";
  const raw = path.join(mediaDir(), `${id}.${isPcm ? "pcm" : "wav"}`);
  await fs.writeFile(raw, buf);
  const mp3 = path.join(mediaDir(), `${id}.mp3`);
  try {
    const args = isPcm ? ["-y", "-f", "s16le", "-ar", rate, "-ac", "1", "-i", raw, "-b:a", "96k", mp3] : ["-y", "-i", raw, "-b:a", "96k", mp3];
    await exec("ffmpeg", ["-loglevel", "error", ...args]);
    await fs.unlink(raw);
    return `/media/${id}.mp3`;
  } catch {
    if (isPcm) {
      // sem ffmpeg: embrulha o PCM num WAV para o browser conseguir tocar
      const wav = path.join(mediaDir(), `${id}.wav`);
      await fs.writeFile(wav, pcmToWav(buf, Number(rate)));
      await fs.unlink(raw);
    }
    return `/media/${id}.wav`;
  }
}

function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
