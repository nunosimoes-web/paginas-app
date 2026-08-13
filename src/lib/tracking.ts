// =============================================================================
//  src/lib/tracking.ts — medição de aberturas e cliques do email diário.
// -----------------------------------------------------------------------------
//  Mesmo padrão do unsubscribe: tokens HMAC derivados do NEXTAUTH_SECRET, sem
//  campos extra na BD para os tokens. O `deliveryId` identifica a entrega do dia.
//
//  Abertura → pixel 1x1 em /api/track/open
//  Clique   → redirect em /api/track/click (só para caminhos internos da app)
// =============================================================================

import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET em falta");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 32);
}

function verify(payload: string, token: string): boolean {
  if (!payload || !token) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function openToken(deliveryId: string): string {
  return sign(`open:${deliveryId}`);
}

export function verifyOpen(deliveryId: string, token: string): boolean {
  return verify(`open:${deliveryId}`, token);
}

export function clickToken(deliveryId: string, path: string): string {
  return sign(`click:${deliveryId}:${path}`);
}

export function verifyClick(
  deliveryId: string,
  path: string,
  token: string,
): boolean {
  return verify(`click:${deliveryId}:${path}`, token);
}

/** Pixel de abertura para embeber no HTML do email. */
export function openPixelUrl(appUrl: string, deliveryId: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/api/track/open?d=${encodeURIComponent(deliveryId)}&t=${openToken(deliveryId)}`;
}

/**
 * Envolve um caminho INTERNO da app (ex.: "/today") num link medido.
 * Só aceita caminhos relativos — nunca URLs absolutos — para não abrir
 * um redirect aberto.
 */
export function trackedLinkUrl(
  appUrl: string,
  deliveryId: string,
  path: string,
): string {
  const base = appUrl.replace(/\/$/, "");
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/today";
  return `${base}/api/track/click?d=${encodeURIComponent(deliveryId)}&r=${encodeURIComponent(safe)}&t=${clickToken(deliveryId, safe)}`;
}
