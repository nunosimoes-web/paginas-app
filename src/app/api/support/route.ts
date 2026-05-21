// =============================================================================
//  POST /api/support — mensagem de suporte / feedback dos utilizadores.
// -----------------------------------------------------------------------------
//  Envia a mensagem por email para SUPPORT_EMAIL (ou REPORT_EMAIL). Aberto a
//  utilizadores autenticados e anónimos.
// =============================================================================

import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  const form = await request.formData();
  const message = String(form.get("message") || "").trim().slice(0, 5000);
  const fromEmail = String(form.get("email") || "").trim().slice(0, 200);
  const locale = form.get("locale") === "en" ? "en" : "pt-PT";
  const prefix = locale === "en" ? "/en" : "";
  const base = (process.env.NEXTAUTH_URL || new URL(request.url).origin).replace(
    /\/$/,
    "",
  );

  if (message) {
    const to =
      process.env.SUPPORT_EMAIL ||
      process.env.REPORT_EMAIL ||
      "nuno.simoes@paginasemetaforas.pt";
    const who = fromEmail || "(sem email indicado)";
    try {
      await sendEmail({
        to,
        subject: "Páginas — mensagem de suporte",
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#33312e;">
<p style="font-size:13px;color:#9a937f;">Mensagem de suporte da Páginas</p>
<p style="font-size:13px;color:#6d675d;"><strong>De:</strong> ${esc(who)}</p>
<p style="font-size:15px;line-height:1.6;white-space:pre-wrap;border-left:3px solid #e6e0d2;padding-left:14px;color:#33312e;">${esc(message)}</p>
</div>`,
        text: `Mensagem de suporte da Páginas\n\nDe: ${who}\n\n${message}`,
      });
    } catch {
      // Não bloquear o utilizador por uma falha de envio.
    }
  }

  return NextResponse.redirect(`${base}${prefix}/support?sent=1`, 303);
}
