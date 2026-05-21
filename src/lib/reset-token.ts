// =============================================================================
//  src/lib/reset-token.ts — tokens de recuperação de palavra-passe.
// -----------------------------------------------------------------------------
//  O token em claro vai no link do email; na BD guarda-se apenas o hash.
//  Expira em 1 hora e é de uso único (campo usedAt em PasswordResetToken).
// =============================================================================

import { createHash, randomBytes } from "crypto";

export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora

/** Gera um par { raw (para o link), hash (para a BD) }. */
export function newResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashResetToken(raw) };
}

/** Hash determinístico de um token em claro (para procurar na BD). */
export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
