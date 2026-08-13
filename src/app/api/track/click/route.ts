// =============================================================================
//  GET /api/track/click — clique no botão do email diário.
// -----------------------------------------------------------------------------
//  Regista o clique e reencaminha para o destino. Só aceita caminhos internos
//  (validados pelo HMAC e por começarem por "/"), nunca URLs externos — não é
//  um redirect aberto. Em caso de dúvida, manda para /today.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClick } from "@/lib/tracking";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("d") || "";
  const raw = url.searchParams.get("r") || "/today";
  const token = url.searchParams.get("t") || "";
  const path = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/today";

  if (id && verifyClick(id, path, token)) {
    try {
      await prisma.promptDelivery.updateMany({
        where: { id },
        data: { emailClickCount: { increment: 1 } },
      });
      await prisma.promptDelivery.updateMany({
        where: { id, emailClickedAt: null },
        data: { emailClickedAt: new Date() },
      });
    } catch {
      // um erro a contar não pode impedir a pessoa de chegar à app
    }
  }

  // O destino tem de ser construído a partir do URL público da app: atrás do
  // proxy, `url.origin` é o endereço interno do container (0.0.0.0:3000).
  const base = (process.env.NEXTAUTH_URL || url.origin).replace(/\/$/, "");
  return NextResponse.redirect(new URL(path, base), 302);
}
