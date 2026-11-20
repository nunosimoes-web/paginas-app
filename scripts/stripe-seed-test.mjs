#!/usr/bin/env node
/**
 * stripe-seed-test.mjs — cria produtos e preços Stripe em modo TESTE,
 * de forma idempotente, com base em lookup_keys estáveis. Serve o Mindwink
 * Plus e o módulo Corpo nos PRs de preview.
 *
 * Regras não-negociáveis:
 *   - Recusa correr se a STRIPE_SECRET_KEY for live (sk_live_ ou rk_live_).
 *   - Idempotente: se um Price com o lookup_key já existir, não cria outro.
 *   - Não altera preços existentes; se o preço precisar de mudar, arquiva o
 *     antigo manualmente no dashboard antes de voltar a correr.
 *   - Imprime no fim, em formato .env, as variáveis STRIPE_PRICE_* para
 *     colar no ambiente local/preview.
 *
 * Uso:
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-seed-test.mjs
 */

import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY ?? "";
if (!KEY) {
  console.error("Falta STRIPE_SECRET_KEY (modo teste).");
  process.exit(2);
}
if (KEY.startsWith("sk_live_") || KEY.startsWith("rk_live_")) {
  console.error(
    "Recusado: chave Stripe LIVE detectada. Este script só corre com chaves de teste (sk_test_/rk_test_).",
  );
  process.exit(3);
}
if (!(KEY.startsWith("sk_test_") || KEY.startsWith("rk_test_"))) {
  console.error("Chave Stripe não reconhecida como teste.");
  process.exit(4);
}

const stripe = new Stripe(KEY, { apiVersion: "2024-06-20" });

// (produto, preço, modo). 6 preços no total — os aprovados pelo Nuno.
const PLANS = [
  {
    key: "plus_month",
    envVar: "STRIPE_PRICE_PLUS_MONTH",
    product: {
      name: "Mindwink Plus (mensal)",
      description: "Camada paga do Mindwink — percursos, exportar diário e resumo semanal.",
    },
    price: { unit_amount: 499, currency: "eur", recurring: { interval: "month" } },
    lookup_key: "mindwink_plus_month",
  },
  {
    key: "plus_year",
    envVar: "STRIPE_PRICE_PLUS_YEAR",
    product: {
      name: "Mindwink Plus (anual)",
      description: "Mindwink Plus pago por ano, ao preço de pouco mais de 3 € por mês.",
    },
    price: { unit_amount: 3900, currency: "eur", recurring: { interval: "year" } },
    lookup_key: "mindwink_plus_year",
  },
  {
    key: "pro_month",
    envVar: "STRIPE_PRICE_PRO_MONTH",
    product: {
      name: "Mindwink Terapeuta Pro (mensal)",
      description: "Clientes ilimitados, temas por sessão e resumo do cliente (com consentimento).",
    },
    price: { unit_amount: 1200, currency: "eur", recurring: { interval: "month" } },
    lookup_key: "mindwink_therapist_pro_month",
  },
  {
    key: "body_month",
    envVar: "STRIPE_PRICE_BODY_MONTH",
    product: {
      name: "Mindwink Corpo (mensal)",
      description: "Módulo Corpo (SomaSignal) Plus — diário de sintomas e relatório 30 dias.",
    },
    price: { unit_amount: 599, currency: "eur", recurring: { interval: "month" } },
    lookup_key: "mindwink_body_month",
  },
  {
    key: "body_year",
    envVar: "STRIPE_PRICE_BODY_YEAR",
    product: {
      name: "Mindwink Corpo (anual)",
      description: "Módulo Corpo (SomaSignal) Plus — pagamento anual.",
    },
    price: { unit_amount: 4500, currency: "eur", recurring: { interval: "year" } },
    lookup_key: "mindwink_body_year",
  },
  {
    key: "body_report",
    envVar: "STRIPE_PRICE_BODY_REPORT",
    product: {
      name: "Relatório 30 dias — Mindwink Corpo",
      description: "Compra avulsa: um relatório de 30 dias para levar ao médico ou terapeuta.",
    },
    price: { unit_amount: 900, currency: "eur" },
    lookup_key: "mindwink_body_report_30d",
  },
];

async function ensureProduct(plan) {
  // Procura por produto com o mesmo nome; se existir reutiliza. Mais simples
  // e menos suscetível a divergência do que abusar de metadata próprio.
  const existing = await stripe.products.search({
    query: `name:'${plan.product.name.replace(/'/g, "\\'")}'`,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0];
  return stripe.products.create({ ...plan.product });
}

async function ensurePrice(plan, productId) {
  const existing = await stripe.prices.list({
    lookup_keys: [plan.lookup_key],
    expand: ["data.product"],
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0];

  return stripe.prices.create({
    ...plan.price,
    product: productId,
    lookup_key: plan.lookup_key,
    transfer_lookup_key: true,
  });
}

const envLines = [];
for (const plan of PLANS) {
  const product = await ensureProduct(plan);
  const price = await ensurePrice(plan, product.id);
  envLines.push(`${plan.envVar}=${price.id}`);
  console.log(`✔ ${plan.key} → ${price.id} (${plan.lookup_key})`);
}

console.log("\n# Copia para o .env local/preview:");
console.log(envLines.join("\n"));
