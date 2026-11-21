import Stripe from "stripe";

// Camada de integração com Stripe — tolerante a ambientes sem chave.
//
// Em desenvolvimento e em preview, STRIPE_SECRET_KEY pode estar vazia; nesse
// caso a aplicação continua a funcionar e as páginas que mencionam pagamento
// mostram um estado "brevemente". Em produção, as rotas de checkout/portal
// devolvem 503 se a chave não existir — nada "crash".
//
// Chaves live (sk_live_ / rk_live_) são recusadas, exceto num preview isolado
// com STRIPE_ALLOW_LIVE_PREVIEW=1 (decisão do Nuno, 20/11: venda de teste com
// cupão 100 %). Nunca definir esta variável em produção. Nunca pôr chaves em git.

export type PlanKey = "plus_month" | "plus_year" | "pro_month" | "body_month" | "body_year" | "body_report";

export const PLAN_LOOKUP_KEYS: Record<PlanKey, string> = {
  plus_month: "mindwink_plus_month",
  plus_year: "mindwink_plus_year",
  pro_month: "mindwink_therapist_pro_month",
  body_month: "mindwink_body_month",
  body_year: "mindwink_body_year",
  body_report: "mindwink_body_report_30d",
};

export const PLAN_PRICE_ENV: Record<PlanKey, string> = {
  plus_month: "STRIPE_PRICE_PLUS_MONTH",
  plus_year: "STRIPE_PRICE_PLUS_YEAR",
  pro_month: "STRIPE_PRICE_PRO_MONTH",
  body_month: "STRIPE_PRICE_BODY_MONTH",
  body_year: "STRIPE_PRICE_BODY_YEAR",
  body_report: "STRIPE_PRICE_BODY_REPORT",
};

export function stripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) return false;
  if (key.startsWith("sk_test_") || key.startsWith("rk_test_")) return true;
  // Live só num ambiente de preview isolado, com a flag explícita. A produção
  // (Coolify) não tem esta variável, por isso continua a recusar chaves live.
  return isLiveKey(key) && process.env.STRIPE_ALLOW_LIVE_PREVIEW === "1";
}

export function isLiveKey(key: string | undefined): boolean {
  if (!key) return false;
  return key.startsWith("sk_live_") || key.startsWith("rk_live_");
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeConfigured()) {
    throw new Error("stripe_not_configured");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      // Fixar a versão evita variação de assinaturas/campos entre deploys.
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return client;
}

export function priceIdFor(plan: PlanKey): string | null {
  return process.env[PLAN_PRICE_ENV[plan]] ?? null;
}

export function isSubscriptionPlan(plan: PlanKey): boolean {
  return plan !== "body_report";
}
