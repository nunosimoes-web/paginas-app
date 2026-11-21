import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import {
  handleCheckoutCompleted,
  handleSubscriptionChanged,
  handleSubscriptionDeleted,
} from "@/lib/stripe-sync";

// Webhook Stripe — modo teste. Assume que o endpoint está registado no
// dashboard e que a chave de assinatura (STRIPE_WEBHOOK_SECRET) está em env.
//
// Idempotência: cada evento Stripe tem um id único; usa-se Purchase.stripe*
// ou o próprio User.stripeCustomerId como barreira — reprocessar um evento
// nunca duplica Purchase nem baralha o plano.

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
