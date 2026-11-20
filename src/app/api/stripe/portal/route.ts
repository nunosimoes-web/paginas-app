import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { isFounder } from "@/lib/plan";

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

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (isFounder(user) || !user.stripeCustomerId) {
    // Founder nunca tem subscrição; outros utilizadores sem customer também
    // não precisam de portal. Devolvemos 409 para o cliente mostrar outra UI.
    return NextResponse.json({ error: "no_customer" }, { status: 409 });
  }

  let body: { locale?: string } = {};
  try {
    body = (await request.json()) as { locale?: string };
  } catch {
    body = {};
  }

  const stripe = getStripe();
  const base = appUrl();
  const localePrefix = body.locale === "en" ? "/en" : "";

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${base}${localePrefix}/settings`,
  });

  return NextResponse.json({ url: portal.url });
}
