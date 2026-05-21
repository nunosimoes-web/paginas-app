"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dayRangeUTC } from "@/lib/day";

export async function markTodayOpened(): Promise<
  { ok: true } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };

  const { start, end } = dayRangeUTC();
  await prisma.promptDelivery.updateMany({
    where: { userId: user.id, date: { gte: start, lte: end } },
    data: { opened: true },
  });

  revalidatePath("/[locale]/(app)/today", "page");
  return { ok: true };
}
