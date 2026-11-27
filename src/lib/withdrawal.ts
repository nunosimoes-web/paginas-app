// Função de retratação (direito de livre resolução) para contratos celebrados
// na app — Diretiva 2011/83/UE, art. 11.º-A, aditado pela Diretiva (UE)
// 2023/2673 (aplicável desde 19/06/2026). O consumidor identifica-se, escolhe o
// contrato e confirma; o profissional envia confirmação de receção por email.
// O reembolso e o cancelamento na Stripe são feitos à mão pela equipa.

import type { Plan } from "@prisma/client";

export type ContractOption = { key: string; label: string };

type UserLike = { plan: Plan; planSource: string | null; planRenewsAt?: Date | null };
type PurchaseLike = { id: string; sku: string; createdAt: Date };

const PLAN_LABEL: Record<"pt-PT" | "en", Record<Exclude<Plan, "FREE">, string>> = {
  "pt-PT": { PLUS: "Assinatura Mindwink Plus (ou Corpo)", THERAPIST_PRO: "Assinatura Terapeuta Pro" },
  en: { PLUS: "Mindwink Plus (or Body) subscription", THERAPIST_PRO: "Therapist Pro subscription" },
};

const SKU_LABEL: Record<"pt-PT" | "en", Record<string, string>> = {
  "pt-PT": { body_report_30d: "Relatório 30 dias (avulso)" },
  en: { body_report_30d: "30-day report (one-off)" },
};

/** Contratos pagos do utilizador que podem ser objeto de retratação. Founder: nenhum. */
export function listContracts(
  user: UserLike,
  purchases: PurchaseLike[],
  locale: string,
): ContractOption[] {
  if (user.planSource === "founder") return [];
  const loc = locale === "en" ? "en" : "pt-PT";
  const out: ContractOption[] = [];
  if (user.planSource === "stripe" && user.plan !== "FREE") {
    out.push({ key: `plan:${user.plan}`, label: PLAN_LABEL[loc][user.plan] });
  }
  for (const p of purchases) {
    const name = SKU_LABEL[loc][p.sku] ?? p.sku;
    out.push({ key: `purchase:${p.id}`, label: `${name} · ${p.createdAt.toISOString().slice(0, 10)}` });
  }
  return out;
}
