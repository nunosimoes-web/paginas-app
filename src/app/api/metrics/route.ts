// =============================================================================
//  GET /api/metrics — utilização diária agregada, para o painel de tração.
// -----------------------------------------------------------------------------
//  Devolve, por dia (UTC, últimos 60 dias): utilizadores ativos (abriram a peça
//  do dia, fizeram check-in ou escreveram no diário), registos novos e peças
//  enviadas por email. Só números agregados — sem emails nem conteúdo.
//
//  Autenticação: `?k=` ou header `x-cron-secret` == env `CRON_SECRET`
//  (o mesmo gate de /api/cron/subscribers).
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DAYS = 60;
const day = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = request.headers.get("x-cron-secret") || url.searchParams.get("k");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const from = new Date(Date.now() - DAYS * 864e5);
  from.setUTCHours(0, 0, 0, 0);

  const [deliveries, checkIns, journals, users] = await Promise.all([
    prisma.promptDelivery.findMany({
      where: { date: { gte: from } },
      select: { userId: true, date: true, emailSentAt: true },
    }),
    prisma.moodCheckIn.findMany({
      where: { createdAt: { gte: from } },
      select: { userId: true, createdAt: true },
    }),
    prisma.journalEntry.findMany({
      where: { createdAt: { gte: from } },
      select: { userId: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true },
    }),
  ]);

  const active = new Map<string, Set<string>>();
  const touch = (d: Date, userId: string) => {
    const k = day(d);
    let s = active.get(k);
    if (!s) active.set(k, (s = new Set()));
    s.add(userId);
  };
  const emailed = new Map<string, number>();
  for (const d of deliveries) {
    touch(d.date, d.userId);
    if (d.emailSentAt) {
      const k = day(d.emailSentAt);
      emailed.set(k, (emailed.get(k) ?? 0) + 1);
    }
  }
  for (const c of checkIns) touch(c.createdAt, c.userId);
  for (const j of journals) touch(j.createdAt, j.userId);
  const signups = new Map<string, number>();
  for (const u of users) {
    const k = day(u.createdAt);
    signups.set(k, (signups.get(k) ?? 0) + 1);
  }

  const days = [];
  for (let i = DAYS; i >= 0; i--) {
    const k = day(new Date(Date.now() - i * 864e5));
    days.push({
      day: k,
      active: active.get(k)?.size ?? 0,
      signups: signups.get(k) ?? 0,
      emailed: emailed.get(k) ?? 0,
    });
  }
  const totalUsers = await prisma.user.count();
  return NextResponse.json({ totalUsers, days });
}
