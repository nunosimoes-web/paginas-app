import { randomInt } from "node:crypto";

// Alfabeto sem caracteres ambíguos (sem I, L, O, 0, 1).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode(): string {
  const block = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(
      "",
    );
  return `${block()}-${block()}`;
}

/** Normaliza o que o utilizador escreve (maiúsculas, sem espaços). */
export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
