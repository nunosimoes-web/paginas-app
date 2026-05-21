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

  const { displayName, locale, promptHour, role } = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: displayName ? displayName : null,
      locale,
      promptHour,
      role,
    },
  });

  revalidatePath("/[locale]/(app)/settings", "page");
  return { ok: true };
}
