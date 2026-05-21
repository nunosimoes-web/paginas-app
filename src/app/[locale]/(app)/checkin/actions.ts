"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkinSchema } from "@/lib/validation";

export async function submitCheckin(
  input: unknown,
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };

  const parsed = checkinSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };

  const { mood, note } = parsed.data;
  await prisma.moodCheckIn.create({
    data: { userId: user.id, mood, note: note ? note : null },
  });

  revalidatePath("/[locale]/(app)/checkin", "page");
  return { ok: true };
}
