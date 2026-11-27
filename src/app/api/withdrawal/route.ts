// =============================================================================
//  POST /api/withdrawal — declaração de retratação em linha (livre resolução).
// -----------------------------------------------------------------------------
//  Diretiva 2011/83/UE, art. 11.º-A (Diretiva (UE) 2023/2673): o consumidor
//  indica nome, contrato e email e confirma. Enviamos a declaração à equipa e
//  uma confirmação de receção ao consumidor (suporte duradouro: email).
//  Não cancela nem reembolsa sozinho: a equipa faz isso na Stripe, em ≤ 14 dias.
//  Founder (amigos) nunca tem contratos pagos: 409.
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { listContracts } from "@/lib/withdrawal";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  contract: z.string().min(1).max(100),
  email: z.email().max(200),
  locale: z.enum(["pt-PT", "en"]).optional(),
});

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const locale = parsed.data.locale ?? "pt-PT";

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const contracts = listContracts(user, purchases, locale);
  if (contracts.length === 0) {
    return NextResponse.json({ error: "no_contract" }, { status: 409 });
  }
  const contract = contracts.find((c) => c.key === parsed.data.contract);
  if (!contract) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { name, email } = parsed.data;
  const when = new Date().toISOString();
  const team =
    process.env.SUPPORT_EMAIL || process.env.REPORT_EMAIL || "hello@mindwink.cognixhub.com";
  const en = locale === "en";

  try {
    await sendEmail({
      to: team,
      replyTo: email,
      subject: "Mindwink — declaração de retratação",
      idempotencyKey: `withdrawal:team:${user.id}:${contract.key}`,
      html: `<p>Declaração de retratação recebida em ${esc(when)}.</p>
<p><strong>Nome:</strong> ${esc(name)}<br><strong>Email:</strong> ${esc(email)}<br><strong>Conta:</strong> ${esc(user.id)}<br><strong>Contrato:</strong> ${esc(contract.label)} (${esc(contract.key)})</p>
<p>Cancelar na Stripe e reembolsar pelo mesmo meio em ≤ 14 dias.</p>`,
      text: `Declaração de retratação recebida em ${when}.\nNome: ${name}\nEmail: ${email}\nConta: ${user.id}\nContrato: ${contract.label} (${contract.key})\nCancelar na Stripe e reembolsar pelo mesmo meio em ≤ 14 dias.`,
    });
    await sendEmail({
      to: email,
      subject: en ? "Mindwink — we received your withdrawal" : "Mindwink — recebemos a tua retratação",
      idempotencyKey: `withdrawal:consumer:${user.id}:${contract.key}`,
      html: en
        ? `<p>Hello, ${esc(name)}.</p><p>We received your withdrawal from the contract <strong>${esc(contract.label)}</strong> on ${esc(when)}. We will refund the payment by the same method within 14 days at most. You don't need to do anything else.</p><p>Mindwink</p>`
        : `<p>Olá, ${esc(name)}.</p><p>Recebemos a tua retratação do contrato <strong>${esc(contract.label)}</strong> em ${esc(when)}. Devolvemos o pagamento pelo mesmo meio, no prazo máximo de 14 dias. Não precisas de fazer mais nada.</p><p>Mindwink</p>`,
      text: en
        ? `Hello, ${name}.\n\nWe received your withdrawal from the contract "${contract.label}" on ${when}. We will refund the payment by the same method within 14 days at most. You don't need to do anything else.\n\nMindwink`
        : `Olá, ${name}.\n\nRecebemos a tua retratação do contrato "${contract.label}" em ${when}. Devolvemos o pagamento pelo mesmo meio, no prazo máximo de 14 dias. Não precisas de fazer mais nada.\n\nMindwink`,
    });
  } catch (error) {
    console.error("[withdrawal] email", error instanceof Error ? error.message : "erro");
    return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, at: when });
}
