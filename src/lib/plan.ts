import type { Plan, User } from "@prisma/client";

// Helpers de plano. A regra fixa: utilizadores "founder" (os 7 amigos atuais)
// têm acesso a tudo e nunca veem paywall, upsell, banner ou preço.

export type PlanContext = {
  plan: Plan;
  planSource: string | null;
};

export function isFounder(u: Pick<User, "planSource">): boolean {
  return u.planSource === "founder";
}

export function hasPlusAccess(u: Pick<User, "plan" | "planSource">): boolean {
  // Founder vê tudo. Caso contrário precisa de plano PLUS ou THERAPIST_PRO
  // (pro inclui o lado pessoal da app).
  if (isFounder(u)) return true;
  return u.plan === "PLUS" || u.plan === "THERAPIST_PRO";
}

export function hasTherapistPro(u: Pick<User, "plan" | "planSource" | "role">): boolean {
  if (isFounder(u)) return true;
  return u.plan === "THERAPIST_PRO";
}

export function showPaywall(u: Pick<User, "planSource" | "plan">): boolean {
  if (isFounder(u)) return false;
  return u.plan === "FREE";
}
