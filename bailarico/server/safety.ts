/**
 * Proteções para um público de 6 a 10 anos:
 * - as descrições das crianças são curtas, sem URLs nem instruções ao modelo;
 * - uma lista de palavras bloqueia temas assustadores/violentos/adultos;
 * - o prompt final embrulha sempre a ideia num estilo alegre e infantil.
 */

const BLOCKLIST = [
  // violência / medo
  "sangue", "blood", "morte", "morto", "matar", "kill", "arma", "pistola", "gun", "faca", "knife", "guerra", "war",
  "zombie", "zumbi", "demónio", "demonio", "demon", "diabo", "devil", "satan", "terror", "horror", "assustador", "scary",
  "gore", "tortura", "torture", "bomba", "bomb", "suicid", "droga", "drug", "cocaína", "cocaine", "álcool", "alcohol",
  "cerveja", "beer", "vinho", "wine", "cigarro", "tabaco", "tobacco",
  // adulto
  "sexo", "sex", "sexy", "nu ", "nua", "nude", "naked", "pornô", "porn", "erótico", "erotic", "bikini", "lingerie", "mamas",
  "boobs", "pénis", "penis", "vagina", "rabo", "ass ", "puta", "fuck", "merda", "shit", "caralho",
  // ódio
  "nazi", "hitler", "racista", "racist", "kkk", "terrorista", "terrorist",
  // pessoas reais / marcas
  "trump", "putin", "cristiano ronaldo", "messi", "mickey", "disney", "pokemon", "pokémon", "nintendo", "fortnite", "minecraft",
];

const MAX_LEN = 140;

export interface SafetyResult {
  ok: boolean;
  cleaned: string;
  reason?: string;
}

export function sanitizeKidText(input: unknown): SafetyResult {
  if (typeof input !== "string") return { ok: false, cleaned: "", reason: "Escreve uma pequena descrição." };
  let s = input.normalize("NFC").replace(/https?:\/\/\S+/gi, " ").replace(/[<>{}[\]`$\\]/g, " ");
  s = s.replace(/\s+/g, " ").trim().slice(0, MAX_LEN);
  if (s.length < 3) return { ok: false, cleaned: s, reason: "Descreve o teu dançarino com mais uma ou duas palavras." };
  const lower = ` ${s.toLowerCase()} `;
  for (const w of BLOCKLIST) {
    if (lower.includes(w)) {
      return { ok: false, cleaned: s, reason: "Hmm, essa ideia não é para o Bailarico. Tenta outra coisa divertida, como um dragão com ténis!" };
    }
  }
  // impede tentativas de dar instruções ao modelo
  if (/\b(ignore|ignora|system|prompt|instru[cç][õo]es)\b/i.test(s)) {
    return { ok: false, cleaned: s, reason: "Descreve só o teu dançarino, por exemplo: um gato astronauta." };
  }
  return { ok: true, cleaned: s };
}

export function sanitizeName(input: unknown): string {
  if (typeof input !== "string") return "amigo";
  const s = input.normalize("NFC").replace(/[^\p{L}\p{M} '-]/gu, "").trim().slice(0, 20);
  return s.length >= 2 ? s : "amigo";
}

export const KID_IMAGE_STYLE =
  "Adorable friendly cartoon character for a children's dance app: {desc}. Full body, mid-dance pose, big happy smile, " +
  "bright cheerful colours, soft rounded shapes, clean flat vector illustration, simple plain pastel background, " +
  "kid-friendly, no text, no watermark.";

export const KID_VIDEO_PROMPT =
  "The character dances happily and energetically to upbeat music: bouncing, waving arms, little jumps and a spin. " +
  "Keeps the exact same cartoon style, bright colours, playful and joyful, smooth motion, plain background, no text.";
