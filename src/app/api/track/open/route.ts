// =============================================================================
//  GET /api/track/open — pixel de abertura do email diário.
// -----------------------------------------------------------------------------
//  Devolve sempre um GIF transparente de 1x1, aconteça o que acontecer: um erro
//  aqui nunca pode partir a renderização do email. Regista a primeira abertura
//  (`emailOpenedAt`) e conta as seguintes (`emailOpenCount`).
//
//  Nota: alguns clientes de email (Gmail) fazem proxy/pré-carregamento das
//  imagens, por isso "aberturas" é sempre uma estimativa por excesso.
// =============================================================================

import { prisma } from "@/lib/prisma";
import { verifyOpen } from "@/lib/tracking";

export const dynamic = "force-dynamic";

// GIF 1x1 transparente.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

function pixel(): Response {
  return new Response(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("d") || "";
    const token = url.searchParams.get("t") || "";
    if (id && verifyOpen(id, token)) {
      await prisma.promptDelivery.updateMany({
        where: { id },
        data: { emailOpenCount: { increment: 1 } },
      });
      // Primeira abertura: só grava se ainda estiver vazio.
      await prisma.promptDelivery.updateMany({
        where: { id, emailOpenedAt: null },
        data: { emailOpenedAt: new Date() },
      });
    }
  } catch {
    // silêncio: o pixel tem de responder sempre
  }
  return pixel();
}
