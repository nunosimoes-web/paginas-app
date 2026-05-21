// =============================================================================
//  GET /api/review/export — exporta as 365 peças em CSV para revisão.
// -----------------------------------------------------------------------------
//  Inclui colunas vazias (acao_sugerida, sugestao) para os revisores anotarem.
//  Não altera nada — as peças mantêm-se intactas, needsReview incluído.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pickText } from "@/lib/content";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  // Mesmo gate da página /review — acesso só por chave.
  const key = process.env.REVIEW_KEY;
  if (!key || new URL(request.url).searchParams.get("k") !== key) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [pieces, themes] = await Promise.all([
    prisma.contentPiece.findMany({ orderBy: [{ day: "asc" }] }),
    prisma.theme.findMany(),
  ]);

  const themeName = (themeId: string | null): string => {
    if (!themeId) return "";
    const th = themes.find((x) => x.id === themeId);
    return th ? pickText(th.nameI18n, "pt-PT") : "";
  };

  const header = [
    "id",
    "dia",
    "tema",
    "tipo",
    "principio",
    "profundidade",
    "por_rever",
    "texto_pt",
    "texto_en",
    "acao_sugerida (manter / editar / remover)",
    "sugestao_de_melhoria",
  ];

  const rows = pieces.map((p) => [
    p.externalId,
    p.day,
    themeName(p.themeId),
    p.type,
    p.principle,
    p.depth,
    p.needsReview ? "sim" : "nao",
    pickText(p.bodyI18n, "pt-PT"),
    pickText(p.bodyI18n, "en"),
    "",
    "",
  ]);

  // BOM UTF-8 para o Excel abrir os acentos corretamente.
  const csv =
    "﻿" +
    [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="paginas-conteudo-365.csv"',
      "Cache-Control": "no-store",
    },
  });
}
