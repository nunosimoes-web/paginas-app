// =============================================================================
//  src/lib/activation.ts — ativação D1 e D7, só com contas novas.
// -----------------------------------------------------------------------------
//  Definição do plano de 60 dias: "ativação D7 = abrir ou escrever pelo menos
//  3 dias na primeira semana". As contas dos amigos ficam fora do cálculo.
//  Só entram no denominador contas cuja janela já fechou.
// =============================================================================

import { isFounderAccount, type AudienceUser } from "./audience";
import { dayIndex } from "./first-week";

export type ActivationUser = AudienceUser & { id: string };

export type Activation = {
  newAccounts: number;
  d1: { eligible: number; activated: number };
  d7: { eligible: number; activated: number };
};

export const D7_MIN_ACTIVE_DAYS = 3;

/** `events`: pares (utilizador, instante) de leitura, check-in ou escrita. */
export function activation(
  users: ActivationUser[],
  events: Array<{ userId: string; at: Date }>,
  now: Date = new Date(),
): Activation {
  const byUser = new Map<string, Set<number>>();
  for (const e of events) {
    let days = byUser.get(e.userId);
    if (!days) byUser.set(e.userId, (days = new Set()));
    days.add(dayIndex(e.at));
  }

  const fresh = users.filter((u) => !isFounderAccount(u));
  const today = dayIndex(now);
  const result: Activation = {
    newAccounts: fresh.length,
    d1: { eligible: 0, activated: 0 },
    d7: { eligible: 0, activated: 0 },
  };

  for (const u of fresh) {
    const start = dayIndex(u.createdAt);
    const days = byUser.get(u.id) ?? new Set<number>();
    // D1: voltou no dia seguinte ao registo.
    if (today > start + 1) {
      result.d1.eligible++;
      if (days.has(start + 1)) result.d1.activated++;
    }
    // D7: ≥ 3 dias ativos nos dias 0 a 6.
    if (today > start + 6) {
      result.d7.eligible++;
      const inWeek = [...days].filter((d) => d >= start && d <= start + 6);
      if (inWeek.length >= D7_MIN_ACTIVE_DAYS) result.d7.activated++;
    }
  }
  return result;
}
