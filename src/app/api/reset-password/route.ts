// =============================================================================
//  POST /api/reset-password — define uma nova palavra-passe a partir do token.
// -----------------------------------------------------------------------------
//  Valida o token (existe, não expirado, não usado), atualiza a palavra-passe
//  e marca o token como usado. Devolve à página com o estado.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/reset-token";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  const locale = form.get("locale") === "en" ? "en" : "pt-PT";
  const prefix = locale === "en" ? "/en" : "";
  const base = (process.env.NEXTAUTH_URL || new URL(request.url).origin).replace(
    /\/$/,
    "",
  );
  const fail = (reason: string) =>
    NextResponse.redirect(
      `${base}${prefix}/reset-password?error=${reason}&token=${encodeURIComponent(token)}`,
      303,
    );

  if (password.length < 8) return fail("weak");

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return fail("invalid");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(`${base}${prefix}/reset-password?done=1`, 303);
}
