"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validation";

export async function updateSettings(
  input: unknown,
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };

  const { displayName, locale, promptHour, emailDaily, role } = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: displayName ? displayName : null,
      locale,
      promptHour,
      emailDaily,
      role,
    },
  });

  revalidatePath("/[locale]/(app)/settings", "page");
  return { ok: true };
}

/**
 * Apaga a conta do utilizador e todos os seus dados (RGPD — direito ao
 * apagamento). Remove primeiro os registos dependentes e depois a conta.
 */
export async function deleteAccount(): Promise<
  { ok: true } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };

  await prisma.$transaction([
    prisma.moodCheckIn.deleteMany({ where: { userId: user.id } }),
    prisma.journalEntry.deleteMany({ where: { userId: user.id } }),
    prisma.userTheme.deleteMany({ where: { userId: user.id } }),
    prisma.promptDelivery.deleteMany({ where: { userId: user.id } }),
    prisma.clientLink.deleteMany({
      where: { OR: [{ therapistId: user.id }, { clientId: user.id }] },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  return { ok: true };
}
