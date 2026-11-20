import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStripe,
  isSubscriptionPlan,
  PLAN_LOOKUP_KEYS,
  priceIdFor,
  stripeConfigured,
  type PlanKey,
} from "@/lib/stripe";
import { isFounder } from "@/lib/plan";

const VALID_PLANS = new Set<PlanKey>([
  "plus_month",
  "plus_year",
  "pro_month",
  "body_month",
  "body_year",
  "body_report",
]);

function appUrl(): string {
  return (
    process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000"
  );
}

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { plan?: string; locale?: string } = {};
  try {
    body = (await request.json()) as { plan?: string; locale?: string };
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const plan = body.plan as PlanKey | undefined;
  if (!plan || !VALID_PLANS.has(plan)) {
    return NextResponse.json({ error: "bad_plan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Founder nunca é cobrado. Se tentar iniciar checkout (não deveria aparecer
  // na UI) devolvemos 409 para marcar que não é necessário.
  if (isFounder(user)) {
    return NextResponse.json({ error: "founder_no_checkout" }, { status: 409 });
  }

  const priceId = priceIdFor(plan);
  if (!priceId) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const locale = body.locale === "en" ? "en" : "pt-PT";
  const base = appUrl();
  const localePrefix = locale === "en" ? "/en" : "";

  let customer: string;
  if (user.stripeCustomerId) {
    customer = user.stripeCustomerId;
  } else {
    const created = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id, lookupKey: PLAN_LOOKUP_KEYS[plan] },
    });
    customer = created.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer },
    });
  }

  const mode = isSubscriptionPlan(plan) ? "subscription" : "payment";

  const checkout = await stripe.checkout.sessions.create(
    {
      mode,
      customer,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}${localePrefix}/precos?status=ok`,
      cancel_url: `${base}${localePrefix}/precos?status=cancel`,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      ...(mode === "subscription"
        ? { subscription_data: { metadata: { userId: user.id, plan } } }
        : { payment_intent_data: { metadata: { userId: user.id, plan } } }),
    },
    {
      // Evita checkouts duplicados numa dupla submissão do browser.
      idempotencyKey: `mw-checkout-${user.id}-${plan}-${Math.floor(Date.now() / 60000)}`,
    },
  );

  return NextResponse.json({ url: checkout.url });
}
