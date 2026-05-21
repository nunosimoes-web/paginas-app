// =============================================================================
//  POST /api/unsubscribe — cancela o email diário (sem login, via token).
// -----------------------------------------------------------------------------
//  Recebe um POST de formulário (u, t, locale) a partir da página de
//  unsubscribe. Validado o token, desliga User.emailDaily e devolve à página
//  com a confirmação. É POST (não GET) para os scanners de email não
//  cancelarem subscrições ao pré-carregar links.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsub } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const u = String(form.get("u") || "");
  const t = String(form.get("t") || "");
  const locale = form.get("locale") === "en" ? "en" : "pt-PT";
  const prefix = locale === "en" ? "/en" : "";
  const base = (process.env.NEXTAUTH_URL || new URL(request.url).origin).replace(
    /\/$/,
    "",
  );

  if (!verifyUnsub(u, t)) {
    return NextResponse.redirect(`${base}${prefix}/unsubscribe?invalid=1`, 303);
  }

  try {
    await prisma.user.update({
      where: { id: u },
      data: { emailDaily: false },
    });
  } catch {
    return NextResponse.redirect(`${base}${prefix}/unsubscribe?invalid=1`, 303);
  }

  return NextResponse.redirect(`${base}${prefix}/unsubscribe?done=1`, 303);
}
