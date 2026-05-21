"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { journalSchema } from "@/lib/validation";

export async function createJournalEntry(
  input: unknown,
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };

  const parsed = journalSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };

  const { body, pieceId } = parsed.data;
  await prisma.journalEntry.create({
    data: { userId: user.id, body, pieceId: pieceId ? pieceId : null },
  });

  revalidatePath("/[locale]/(app)/journal", "page");
  return { ok: true };
}

export async function deleteJournalEntry(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };

  // Apaga apenas se a entrada pertencer ao utilizador.
  await prisma.journalEntry.deleteMany({ where: { id, userId: user.id } });

  revalidatePath("/[locale]/(app)/journal", "page");
  return { ok: true };
}
