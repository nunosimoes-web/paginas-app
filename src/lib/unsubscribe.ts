// =============================================================================
//  src/lib/unsubscribe.ts — token de cancelamento de subscrição (sem login).
// -----------------------------------------------------------------------------
//  O link de unsubscribe nos emails não exige sessão: leva um token HMAC
//  derivado do id do utilizador + NEXTAUTH_SECRET. Não há campo extra na BD.
// =============================================================================

import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET em falta");
  return s;
}

/** Token opaco para o utilizador cancelar a subscrição. */
export function unsubToken(userId: string): string {
  return createHmac("sha256", secret()).update(`unsub:${userId}`).digest("hex");
}

/** Verifica o par (userId, token) em tempo constante. */
export function verifyUnsub(userId: string, token: string): boolean {
  if (!userId || !token) return false;
  const expected = Buffer.from(unsubToken(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** URL completo de unsubscribe, ciente do locale (pt-PT serve em "/"). */
export function unsubscribeUrl(
  appUrl: string,
  userId: string,
  locale: string,
): string {
  const prefix = locale === "en" ? "/en" : "";
  const base = appUrl.replace(/\/$/, "");
  return `${base}${prefix}/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubToken(userId)}`;
}
