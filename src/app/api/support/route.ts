// =============================================================================
//  POST /api/support — mensagem de suporte / feedback dos utilizadores.
// -----------------------------------------------------------------------------
//  Envia a mensagem por email para SUPPORT_EMAIL (ou REPORT_EMAIL). Aberto a
//  utilizadores autenticados e anónimos.
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { guardPublicForm, readPublicBody, PublicFormError, privateDigest } from "@/lib/public-form-security";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await readPublicBody(request, "form");
    if (typeof data.message !== "string" || data.message.trim().length < 5 || data.message.length > 5000 ||
        (data.email && (typeof data.email !== "string" || data.email.length > 200 || !z.email().safeParse(data.email.trim()).success))) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    await guardPublicForm(request, data, "support");
  } catch (error) {
    return NextResponse.json({ error: error instanceof PublicFormError ? error.code : "temporarily_unavailable" }, { status: error instanceof PublicFormError ? error.status : 503 });
  }
  const message = (data.message as string).trim();
  const fromEmail = typeof data.email === "string" ? data.email.trim() : "";
  const locale = data.locale === "en" ? "en" : "pt-PT";
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
        replyTo: z.email().safeParse(fromEmail).success ? fromEmail : undefined,
        subject: "Mindwink — mensagem de suporte",
        idempotencyKey: "support:" + privateDigest("support-delivery", `${fromEmail}\0${message}`),
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#33312e;">
<p style="font-size:13px;color:#9a937f;">Mensagem de suporte do Mindwink</p>
<p style="font-size:13px;color:#6d675d;"><strong>De:</strong> ${esc(who)}</p>
<p style="font-size:15px;line-height:1.6;white-space:pre-wrap;border-left:3px solid #e6e0d2;padding-left:14px;color:#33312e;">${esc(message)}</p>
</div>`,
        text: `Mensagem de suporte do Mindwink\n\nDe: ${who}\n\n${message}`,
      });
    } catch {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
  }

  const redirectTo = `${base}${prefix}/support?sent=1`;
  return request.headers.get("accept")?.includes("application/json")
    ? NextResponse.json({ ok: true, redirectTo }) : NextResponse.redirect(redirectTo, 303);
}
