// =============================================================================
//  POST /api/cron/send-emails — envio da peça do dia por email.
// -----------------------------------------------------------------------------
//  Chamado de hora a hora por uma tarefa agendada do Coolify. Para cada
//  utilizador com onboarding feito cuja hora preferida (`promptHour`) coincide
//  com a hora atual em Lisboa, envia a peça do dia. Idempotente: o campo
//  `emailSentAt` da entrega garante um envio único por dia.
//
//  Autenticação: header `x-cron-secret` == env `CRON_SECRET`.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { selectDailyPiece } from "@/lib/engine";
import { dayRangeUTC } from "@/lib/day";
import { pickText } from "@/lib/content";
import { sendDailyEmail } from "@/lib/email";
import { unsubscribeUrl } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

/** Hora (0–23) no fuso de Lisboa. */
function lisbonHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      hour12: false,
    }).format(date),
  );
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ?hour=8 força uma hora específica (útil para testes); senão usa a hora de Lisboa.
  const forced = new URL(request.url).searchParams.get("hour");
  const hour =
    forced !== null && forced !== "" ? Number(forced) : lisbonHour(new Date());

  const appUrl = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  const { iso: dayISO, start, end } = dayRangeUTC();

  const users = await prisma.user.findMany({
    where: { onboardedAt: { not: null }, promptHour: hour, emailDaily: true },
  });
  const themes = await prisma.theme.findMany();
  const themeName = (slug: string | null, locale: string): string | null => {
    if (!slug) return null;
    const t = themes.find((x) => x.slug === slug);
    return t ? pickText(t.nameI18n, locale) : null;
  };

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      const piece = await selectDailyPiece(prisma, user.id);
      const delivery = await prisma.promptDelivery.findFirst({
        where: { userId: user.id, date: { gte: start, lte: end } },
      });
      if (!delivery) {
        failed++;
        errors.push(`${user.email}: sem entrega registada`);
        continue;
      }
      if (delivery.emailSentAt) {
        skipped++;
        continue;
      }

      // Reclamar o envio de forma ATÓMICA antes de enviar. O `updateMany`
      // condicional (`emailSentAt: null`) só afeta uma linha; se outra execução
      // sobreposta já a reclamou, `count` é 0 e não reenviamos. Isto fecha a
      // condição de corrida entre o "ler" e o "marcar" que causava duplicados.
      const claim = await prisma.promptDelivery.updateMany({
        where: { id: delivery.id, emailSentAt: null },
        data: { emailSentAt: new Date() },
      });
      if (claim.count === 0) {
        skipped++;
        continue;
      }

      try {
        await sendDailyEmail({
          to: user.email,
          locale: user.locale,
          displayName: user.displayName,
          pieceType: piece.type,
          themeName: themeName(piece.themeSlug, user.locale),
          body: pickText(piece.bodyI18n, user.locale),
          appUrl,
          unsubscribeUrl: unsubscribeUrl(appUrl, user.id, user.locale),
          // Defesa adicional: a Resend recusa um reenvio com a mesma chave 24h.
          idempotencyKey: `paginas-daily-${user.id}-${dayISO}`,
          deliveryId: delivery.id,
        });
        sent++;
      } catch (e) {
        // Falha no envio: libertar a reclamação para nova tentativa futura.
        await prisma.promptDelivery.update({
          where: { id: delivery.id },
          data: { emailSentAt: null },
        });
        throw e;
      }
    } catch (e) {
      failed++;
      errors.push(`${user.email}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ hour, candidates: users.length, sent, skipped, failed, errors });
}
