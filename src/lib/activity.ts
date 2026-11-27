import { prisma } from "./prisma";
import type { Activity } from "./first-week";

const WINDOW_DAYS = 60;

/** Datas da atividade recente; nunca o conteúdo do diário nem o valor do humor. */
export async function loadActivity(
  userId: string,
  now: Date = new Date(),
): Promise<Activity> {
  const from = new Date(now.getTime() - WINDOW_DAYS * 86_400_000);
  const [reads, checkIns, entries] = await Promise.all([
    prisma.promptDelivery.findMany({
      where: { userId, opened: true, date: { gte: from } },
      select: { date: true },
    }),
    prisma.moodCheckIn.findMany({
      where: { userId, createdAt: { gte: from } },
      select: { createdAt: true },
    }),
    prisma.journalEntry.findMany({
      where: { userId, createdAt: { gte: from } },
      select: { createdAt: true },
    }),
  ]);
  return {
    readDays: reads.map((r) => r.date),
    checkIns: checkIns.map((r) => r.createdAt),
    journalEntries: entries.map((r) => r.createdAt),
  };
}
