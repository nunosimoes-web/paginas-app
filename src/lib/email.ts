// =============================================================================
//  src/lib/email.ts — Envio de email transacional (Resend).
// -----------------------------------------------------------------------------
//  A peça do dia, enviada por email à hora escolhida pelo utilizador.
//  Copy de bem-estar, nunca clínica. Sem dependências — usa a HTTP API da Resend.
// =============================================================================

import type { DailyPieceForUser } from "./engine";

type PieceType = DailyPieceForUser["type"];

interface Copy {
  subject: string;
  greeting: (name?: string | null) => string;
  intro: string;
  pieceType: Record<PieceType, string>;
  themeLabel: string;
  cta: string;
  closing: string;
  disclaimer: string;
  footer: string;
  unsubscribe: string;
}

const COPY: Record<"pt-PT" | "en", Copy> = {
  "pt-PT": {
    subject: "A tua peça de hoje · Páginas",
    greeting: (name) => (name ? `Olá, ${name}.` : "Olá."),
    intro: "A tua peça de hoje.",
    pieceType: {
      METAPHOR: "Metáfora",
      REMINDER: "Lembrete",
      EXERCISE: "Exercício",
      REFLECTION: "Reflexão",
    },
    themeLabel: "Tema",
    cta: "Abrir a Páginas",
    closing: "Quando te servir. Sem pressa.",
    disclaimer:
      "Conteúdo de bem-estar em revisão por profissionais. A Páginas é um apoio de reflexão e não substitui acompanhamento clínico.",
    footer:
      "Recebes este email porque escolheste uma hora para a tua peça diária nas definições da Páginas.",
    unsubscribe: "Cancelar a subscrição",
  },
  en: {
    subject: "Your piece for today · Páginas",
    greeting: (name) => (name ? `Hello, ${name}.` : "Hello."),
    intro: "Your piece for today.",
    pieceType: {
      METAPHOR: "Metaphor",
      REMINDER: "Reminder",
      EXERCISE: "Exercise",
      REFLECTION: "Reflection",
    },
    themeLabel: "Theme",
    cta: "Open Páginas",
    closing: "Whenever it serves you. No rush.",
    disclaimer:
      "Wellbeing content under review by professionals. Páginas is a reflective companion and not a substitute for clinical care.",
    footer:
      "You receive this email because you chose a time for your daily piece in Páginas settings.",
    unsubscribe: "Unsubscribe",
  },
};

export interface DailyEmailInput {
  to: string;
  locale: string;
  displayName?: string | null;
  pieceType: PieceType;
  themeName?: string | null;
  /** Texto da peça, já escolhido no locale do utilizador. */
  body: string;
  /** URL público da app (sem barra final). */
  appUrl: string;
  /** URL de cancelamento de subscrição (com token). */
  unsubscribeUrl: string;
  /** Chave de idempotência (ex.: por utilizador+dia) — a Resend recusa duplicados. */
  idempotencyKey?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function render(c: Copy, input: DailyEmailInput): { html: string; text: string } {
  const kicker = [c.pieceType[input.pieceType], input.themeName ? `${c.themeLabel}: ${input.themeName}` : null]
    .filter(Boolean)
    .join("  ·  ");
  const today = `${input.appUrl}/today`;
  const greeting = c.greeting(input.displayName);

  const html = `<!doctype html>
<html lang="${input.locale === "en" ? "en" : "pt"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3efe6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe6;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#fffdf8;border:1px solid #e6e0d2;border-radius:14px;">
        <tr><td style="padding:34px 38px 8px 38px;font-family:Georgia,'Times New Roman',serif;font-size:18px;letter-spacing:.5px;color:#9a937f;">Páginas</td></tr>
        <tr><td style="padding:14px 38px 0 38px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;color:#33312e;">${escapeHtml(greeting)}</td></tr>
        <tr><td style="padding:4px 38px 0 38px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#9a937f;">${escapeHtml(c.intro)}</td></tr>
        <tr><td style="padding:22px 38px 0 38px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#a79f88;">${escapeHtml(kicker)}</td></tr>
        <tr><td style="padding:12px 38px 0 38px;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1.62;color:#33312e;">${escapeHtml(input.body)}</td></tr>
        <tr><td style="padding:20px 38px 0 38px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-style:italic;color:#9a937f;">${escapeHtml(c.closing)}</td></tr>
        <tr><td style="padding:24px 38px 4px 38px;">
          <a href="${today}" style="display:inline-block;background:#6f7d5c;color:#fffdf8;text-decoration:none;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;padding:11px 22px;border-radius:9px;">${escapeHtml(c.cta)}</a>
        </td></tr>
        <tr><td style="padding:26px 38px 0 38px;"><div style="border-top:1px solid #ece6d8;"></div></td></tr>
        <tr><td style="padding:16px 38px 0 38px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#6f6a5c;">${escapeHtml(c.disclaimer)}</td></tr>
        <tr><td style="padding:10px 38px 32px 38px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#74705f;">${escapeHtml(c.footer)} &nbsp;·&nbsp; <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#74705f;text-decoration:underline;">${escapeHtml(c.unsubscribe)}</a></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    "Páginas",
    "",
    greeting,
    c.intro,
    "",
    kicker,
    "",
    input.body,
    "",
    c.closing,
    "",
    `${c.cta}: ${today}`,
    "",
    "—",
    c.disclaimer,
    c.footer,
    `${c.unsubscribe}: ${input.unsubscribeUrl}`,
  ].join("\n");

  return { html, text };
}

/** Envio genérico via Resend. Lança em caso de falha (o chamador trata). */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  /** Header `Idempotency-Key` da Resend: bloqueia reenvios do mesmo email 24h. */
  idempotencyKey?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY em falta");
  const from = process.env.EMAIL_FROM || "Páginas <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(opts.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      ...(opts.headers ? { headers: opts.headers } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/** Envia a peça do dia por email. Lança em caso de falha (o chamador trata). */
export async function sendDailyEmail(input: DailyEmailInput): Promise<void> {
  const c = COPY[input.locale === "en" ? "en" : "pt-PT"];
  const { html, text } = render(c, input);
  await sendEmail({
    to: input.to,
    subject: c.subject,
    html,
    text,
    // Permite o botão nativo de cancelar subscrição nos clientes de email.
    headers: { "List-Unsubscribe": `<${input.unsubscribeUrl}>` },
    idempotencyKey: input.idempotencyKey,
  });
}
