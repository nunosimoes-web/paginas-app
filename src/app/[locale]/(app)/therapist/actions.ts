"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/invite";
import { seedThemesSchema } from "@/lib/validation";

export async function createInviteCode(): Promise<
  { ok: true; code: string } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };
  if (user.role !== "THERAPIST") return { error: "forbidden" };

  // Tenta algumas vezes em caso de colisão (improvável).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const existing = await prisma.clientLink.findUnique({
      where: { inviteCode: code },
    });
    if (existing) continue;
    await prisma.clientLink.create({
      data: { therapistId: user.id, inviteCode: code, status: "pending" },
    });
    revalidatePath("/[locale]/(app)/therapist", "page");
    return { ok: true, code };
  }
  return { error: "retry" };
}

export async function seedThemes(
  input: unknown,
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };
  if (user.role !== "THERAPIST") return { error: "forbidden" };

  const parsed = seedThemesSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const { clientId: linkId, themeSlugs } = parsed.data;

  const link = await prisma.clientLink.findUnique({ where: { id: linkId } });
  if (!link || link.therapistId !== user.id || link.status !== "active") {
    return { error: "not_found" };
  }

  // O motor lê seededThemes como { slug: ISOdate }; a janela de prioridade
  // é de 7 dias a contar de cada data.
  const today = new Date().toISOString().slice(0, 10);
  const seededThemes = Object.fromEntries(themeSlugs.map((s) => [s, today]));

  await prisma.clientLink.update({
    where: { id: linkId },
    data: { seededThemes },
  });

  revalidatePath("/[locale]/(app)/therapist/[clientId]", "page");
  return { ok: true };
}
