// =============================================================================
//  GET /api/cron/subscribers — quem recebe (ou não) o email diário da peça.
// -----------------------------------------------------------------------------
//  Endpoint só de leitura. Devolve, para cada utilizador, o estado do opt-in do
//  email diário (`emailDaily`), a hora preferida (`promptHour`), se o onboarding
//  está concluído e o histórico de envios. A regra do envio diário é:
//  onboardedAt != null  E  emailDaily = true  →  recebe às `promptHour` (Lisboa).
//
//  Autenticação: header `x-cron-secret` ou `?k=` == env `CRON_SECRET`.
//  Não devolve conteúdo pessoal (diário, check-ins) — apenas estado de subscrição.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = request.headers.get("x-cron-secret") || url.searchParams.get("k");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      locale: true,
      promptHour: true,
      emailDaily: true,
      onboardedAt: true,
      createdAt: true,
      _count: { select: { deliveries: true } },
    },
  });

  const sentAgg = await prisma.promptDelivery.groupBy({
    by: ["userId"],
    where: { emailSentAt: { not: null } },
    _count: { _all: true },
    _max: { emailSentAt: true },
  });
  const openedAgg = await prisma.promptDelivery.groupBy({
    by: ["userId"],
    where: { opened: true },
    _count: { _all: true },
  });
  const mailOpenAgg = await prisma.promptDelivery.groupBy({
    by: ["userId"],
    where: { emailOpenedAt: { not: null } },
    _count: { _all: true },
    _max: { emailOpenedAt: true },
  });
  const mailClickAgg = await prisma.promptDelivery.groupBy({
    by: ["userId"],
    where: { emailClickedAt: { not: null } },
    _count: { _all: true },
    _max: { emailClickedAt: true },
  });

  const sentBy = new Map(sentAgg.map((r) => [r.userId, r]));
  const openedBy = new Map(openedAgg.map((r) => [r.userId, r._count._all]));
  const mailOpenBy = new Map(mailOpenAgg.map((r) => [r.userId, r]));
  const mailClickBy = new Map(mailClickAgg.map((r) => [r.userId, r]));

  const rows = users.map((u) => {
    const s = sentBy.get(u.id);
    const mo = mailOpenBy.get(u.id);
    const mc = mailClickBy.get(u.id);
    return {
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      locale: u.locale,
      promptHour: u.promptHour,
      emailDaily: u.emailDaily,
      onboarded: u.onboardedAt !== null,
      onboardedAt: u.onboardedAt,
      createdAt: u.createdAt,
      receivesDailyEmail: u.emailDaily && u.onboardedAt !== null,
      emailsSent: s?._count._all ?? 0,
      lastEmailSentAt: s?._max.emailSentAt ?? null,
      deliveries: u._count.deliveries,
      // "opened" = marcou a peça como lida dentro da app (não é abertura de email).
      markedReadInApp: openedBy.get(u.id) ?? 0,
      // Medição do email propriamente dita (a partir de 13/08/2026).
      emailsOpened: mo?._count._all ?? 0,
      lastEmailOpenedAt: mo?._max.emailOpenedAt ?? null,
      emailsClicked: mc?._count._all ?? 0,
      lastEmailClickedAt: mc?._max.emailClickedAt ?? null,
    };
  });

  const receiving = rows.filter((r) => r.receivesDailyEmail);
  const byHour: Record<string, number> = {};
  for (const r of receiving) {
    byHour[String(r.promptHour)] = (byHour[String(r.promptHour)] ?? 0) + 1;
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    rule: "recebe = onboarding concluido AND emailDaily=true; envio à promptHour (Europe/Lisbon)",
    totals: {
      users: rows.length,
      onboarded: rows.filter((r) => r.onboarded).length,
      optInTrue: rows.filter((r) => r.emailDaily).length,
      optOut: rows.filter((r) => !r.emailDaily).length,
      receivingDailyEmail: receiving.length,
      notReceivingBecauseNoOnboarding: rows.filter(
        (r) => r.emailDaily && !r.onboarded,
      ).length,
    },
    byHour,
    users: rows,
  });
}
