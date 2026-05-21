// =============================================================================
//  POST /api/cron/daily-report — relatório diário de utilização por email.
// -----------------------------------------------------------------------------
//  Chamado uma vez por dia por uma tarefa agendada do Coolify. Envia para
//  REPORT_EMAIL um resumo de utilização da app (números + tabela por utilizador).
//
//  Autenticação: header `x-cron-secret` == env `CRON_SECRET`.
// =============================================================================

import { NextResponse } from "next/server";
import { buildUsageReport } from "@/lib/report";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const to = process.env.REPORT_EMAIL || "nuno.simoes@paginasemetaforas.pt";
  try {
    const { subject, html, text } = await buildUsageReport();
    await sendEmail({ to, subject, html, text });
    return NextResponse.json({ ok: true, to });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
