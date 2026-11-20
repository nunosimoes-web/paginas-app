import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured, type PlanKey } from "@/lib/stripe";

// Webhook Stripe — modo teste. Assume que o endpoint está registado no
// dashboard e que a chave de assinatura (STRIPE_WEBHOOK_SECRET) está em env.
//
// Idempotência: cada evento Stripe tem um id único; usa-se Purchase.stripe*
// ou o próprio User.stripeCustomerId como barreira — reprocessar um evento
// nunca duplica Purchase nem baralha o plano.

const PLAN_TO_PLAN: Record<Exclude<PlanKey, "body_report">, { plan: "PLUS" | "THERAPIST_PRO" }> = {
  plus_month: { plan: "PLUS" },
  plus_year: { plan: "PLUS" },
  pro_month: { plan: "THERAPIST_PRO" },
  body_month: { plan: "PLUS" },
  body_year: { plan: "PLUS" },
};

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_secret_missing" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(s);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionChanged(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      // Outros eventos são ignorados mas respondidos com 200 para evitar
      // retries do Stripe.
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe.webhook] handler error", event.type, error);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(s: Stripe.Checkout.Session) {
  const userId = (s.metadata?.userId ?? s.client_reference_id ?? "") as string;
  const plan = (s.metadata?.plan ?? "") as PlanKey;
  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  // Marca stripeCustomerId se ainda não estava registado.
  if (typeof s.customer === "string" && !user.stripeCustomerId) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: s.customer },
    });
  }

  // Compras one-shot (body_report): cria Purchase idempotente por sessão.
  if (s.mode === "payment" && plan === "body_report" && s.id) {
    await prisma.purchase.upsert({
      where: { stripeSessionId: s.id },
      update: {},
      create: {
        userId,
        sku: "body_report_30d",
        stripeSessionId: s.id,
        stripePaymentIntent:
          typeof s.payment_intent === "string" ? s.payment_intent : null,
        amountCents: s.amount_total ?? 0,
        currency: (s.currency ?? "eur").toLowerCase(),
      },
    });
    return;
  }

  // Modo subscription: subscription.created já vai actualizar o plano. Aqui
  // só reforçamos a origem ("stripe") para quando a assinatura estiver viva.
  if (s.mode === "subscription" && plan in PLAN_TO_PLAN) {
    const target = PLAN_TO_PLAN[plan as keyof typeof PLAN_TO_PLAN];
    await prisma.user.update({
      where: { id: userId },
      // Nunca sobrescreve "founder" — é a regra fixa.
      data: {
        plan: user.planSource === "founder" ? user.plan : target.plan,
        planSource: user.planSource === "founder" ? user.planSource : "stripe",
      },
    });
  }
}

async function handleSubscriptionChanged(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : null;
  if (!customerId) return;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return;

  // Regra fixa: founder nunca é mexido pelo webhook.
  if (user.planSource === "founder") return;

  const plan = (sub.metadata?.plan ?? "") as PlanKey | "";
  const active = sub.status === "active" || sub.status === "trialing";

  const target =
    plan && plan in PLAN_TO_PLAN
      ? PLAN_TO_PLAN[plan as keyof typeof PLAN_TO_PLAN].plan
      : null;

  // O cliente moderno do Stripe expõe current_period_end dentro de items.data[0]
  // (não na raiz). Em casos legacy o campo pode ainda aparecer na raiz, pelo
  // que tratamos ambos.
  const subAny = sub as unknown as { current_period_end?: number };
  const itemEnd = sub.items?.data?.[0]?.current_period_end;
  const renewsEpoch =
    typeof itemEnd === "number"
      ? itemEnd
      : typeof subAny.current_period_end === "number"
      ? subAny.current_period_end
      : null;
  const renewsAt = renewsEpoch !== null ? new Date(renewsEpoch * 1000) : null;

  if (active && target) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: target,
        planSource: "stripe",
        planRenewsAt: renewsAt,
      },
    });
  } else if (!active) {
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "FREE", planRenewsAt: null },
    });
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : null;
  if (!customerId) return;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return;
  if (user.planSource === "founder") return;

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "FREE", planRenewsAt: null },
  });
}
