"use server";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { connectSchema } from "@/lib/validation";
import { normalizeInviteCode } from "@/lib/invite";

export async function connectWithCode(
  input: unknown,
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };

  const parsed = connectSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const code = normalizeInviteCode(parsed.data.code);

  const link = await prisma.clientLink.findUnique({
    where: { inviteCode: code },
  });
  if (!link || link.status !== "pending" || link.clientId) {
    return { error: "invalid" };
  }
  if (link.therapistId === user.id) return { error: "self" };

  const already = await prisma.clientLink.findFirst({
    where: { therapistId: link.therapistId, clientId: user.id },
  });
  if (already) return { error: "already_linked" };

  await prisma.clientLink.update({
    where: { id: link.id },
    data: { clientId: user.id, status: "active" },
  });

  return { ok: true };
}
