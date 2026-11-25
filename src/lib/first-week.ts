// =============================================================================
//  src/lib/first-week.ts — da primeira visita ao hábito, sem culpa.
// -----------------------------------------------------------------------------
//  Núcleo puro (sem Prisma nem React): recebe o que a pessoa já fez e decide o
//  que o ecrã "Hoje" lhe mostra por baixo da peça. No máximo UMA coisa de cada
//  vez. Não há sequências (streaks) nem contagens do que ficou por fazer.
// =============================================================================

import { isFounderAccount, type AudienceUser } from "./audience";

const DAY_MS = 86_400_000;
/** Dias em que os primeiros passos continuam visíveis. */
export const FIRST_STEPS_DAYS = 7;
/** Sem atividade há pelo menos estes dias: acolhemos o regresso. */
export const RETURN_AFTER_DAYS = 3;
/** Dias (a contar do primeiro = 1) em que mostramos a primeira semana. */
export const RECAP_FROM_DAY = 7;
export const RECAP_UNTIL_DAY = 9;

export type Activity = {
  /** Dias com peça marcada como lida. */
  readDays: Date[];
  checkIns: Date[];
  journalEntries: Date[];
};

export type FirstStepKey = "read" | "checkin" | "write";
export type FirstStep = { key: FirstStepKey; done: boolean };

export type TodayExtra =
  | { kind: "first-steps"; steps: FirstStep[]; next: FirstStepKey }
  | { kind: "welcome-back" }
  | { kind: "week-recap"; activeDays: number; entries: number }
  | { kind: "checkin-nudge" }
  | null;

/** Índice do dia em UTC, alinhado com dayRangeUTC e com as entregas do motor. */
export function dayIndex(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

/** Dia 1 = dia em que o onboarding foi concluído. */
export function dayNumber(since: Date, now: Date): number {
  return Math.max(1, dayIndex(now) - dayIndex(since) + 1);
}

export function activeDayIndexes(activity: Activity): Set<number> {
  return new Set(
    [
      ...activity.readDays,
      ...activity.checkIns,
      ...activity.journalEntries,
    ].map(dayIndex),
  );
}

export function firstSteps(activity: Activity): FirstStep[] {
  return [
    { key: "read", done: activity.readDays.length > 0 },
    { key: "checkin", done: activity.checkIns.length > 0 },
    { key: "write", done: activity.journalEntries.length > 0 },
  ];
}

/** O que mostrar por baixo da peça de hoje. `null` = nada (sempre, para amigos). */
export function todayExtra(
  user: AudienceUser & { onboardedAt: Date | null },
  activity: Activity,
  now: Date = new Date(),
): TodayExtra {
  if (isFounderAccount(user) || !user.onboardedAt) return null;

  const today = dayIndex(now);
  const day = dayNumber(user.onboardedAt, now);
  const active = activeDayIndexes(activity);
  const past = [...active].filter((d) => d < today);
  const lastPast = past.length
    ? Math.max(...past)
    : dayIndex(user.onboardedAt);

  // Regresso depois de uma pausa: primeiro acolher, só depois sugerir.
  if (!active.has(today) && today - lastPast >= RETURN_AFTER_DAYS) {
    return { kind: "welcome-back" };
  }

  const steps = firstSteps(activity);
  const next = steps.find((s) => !s.done);
  if (next && day <= FIRST_STEPS_DAYS) {
    return { kind: "first-steps", steps, next: next.key };
  }

  if (day >= RECAP_FROM_DAY && day <= RECAP_UNTIL_DAY && active.size >= 2) {
    const start = dayIndex(user.onboardedAt);
    const inWeek = (i: number) => i >= start && i < start + 7;
    return {
      kind: "week-recap",
      activeDays: [...active].filter(inWeek).length,
      entries: activity.journalEntries.filter((d) => inWeek(dayIndex(d)))
        .length,
    };
  }

  if (!activity.checkIns.some((d) => dayIndex(d) === today)) {
    return { kind: "checkin-nudge" };
  }
  return null;
}

/** Contas novas com poucas entradas recebem inícios de frase no diário. */
export function showsWritingStarters(
  user: AudienceUser,
  entryCount: number,
): boolean {
  return !isFounderAccount(user) && entryCount < 3;
}
