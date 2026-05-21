// =============================================================================
//  POST /api/forgot-password — pedido de recuperação de palavra-passe.
// -----------------------------------------------------------------------------
//  Recebe um email. Se existir conta, cria um token e envia o link por email.
//  A resposta é sempre a mesma (redirect para ?sent=1) — não revela se o email
//  está ou não registado.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { newResetToken, RESET_TTL_MS } from "@/lib/reset-token";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const COPY = {
  "pt-PT": {
    subject: "Recuperar a palavra-passe · Páginas",
    heading: "Recuperar a palavra-passe",
    body: "Recebemos um pedido para repor a tua palavra-passe na Páginas. Carrega no botão abaixo — o link é válido durante 1 hora.",
    cta: "Definir nova palavra-passe",
    ignore:
      "Se não foste tu a pedir, podes ignorar este email — a tua palavra-passe não muda.",
  },
  en: {
    subject: "Reset your password · Páginas",
    heading: "Reset your password",
    body: "We received a request to reset your Páginas password. Tap the button below — the link is valid for 1 hour.",
    cta: "Set a new password",
    ignore:
      "If you didn't request this, you can ignore this email — your password stays the same.",
  },
};

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const locale = form.get("locale") === "en" ? "en" : "pt-PT";
  const prefix = locale === "en" ? "/en" : "";
  const base = (process.env.NEXTAUTH_URL || new URL(request.url).origin).replace(
    /\/$/,
    "",
  );
  const redirectUrl = `${base}${prefix}/forgot-password?sent=1`;

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      try {
        const { raw, hash } = newResetToken();
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hash,
            expiresAt: new Date(Date.now() + RESET_TTL_MS),
          },
        });
        const link = `${base}${prefix}/reset-password?token=${raw}`;
        const c = COPY[locale];
        await sendEmail({
          to: user.email,
          subject: c.subject,
          html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#33312e;">
<p style="font-family:Georgia,serif;font-size:17px;color:#9a937f;">Páginas</p>
<h1 style="font-size:19px;color:#33312e;">${c.heading}</h1>
<p style="font-size:14px;line-height:1.6;color:#6d675d;">${c.body}</p>
<p style="margin:22px 0;"><a href="${link}" style="display:inline-block;background:#6f7d5c;color:#fffdf8;text-decoration:none;font-size:14px;padding:11px 22px;border-radius:9px;">${c.cta}</a></p>
<p style="font-size:12px;line-height:1.6;color:#a79f88;">${c.ignore}</p>
</div>`,
          text: `Páginas — ${c.heading}\n\n${c.body}\n\n${link}\n\n${c.ignore}`,
        });
      } catch {
        // Falha de envio não deve revelar nada ao cliente.
      }
    }
  }

  return NextResponse.redirect(redirectUrl, 303);
}
