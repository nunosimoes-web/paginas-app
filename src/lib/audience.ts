// =============================================================================
//  src/lib/audience.ts — quem pode ver novidades.
// -----------------------------------------------------------------------------
//  REGRA FIXA: os utilizadores que já existiam (amigos, planSource="founder")
//  não veem preços, upsell nem nada de novo. Este módulo é o único sítio onde
//  essa decisão se toma; qualquer UI nova passa por `seesNewExperience`.
//
//  A coluna `planSource` ainda não existe em main (chega com o Mindwink Plus).
//  Por isso a regra tem duas fontes e basta uma para proteger a conta:
//   - planSource === "founder" (quando a coluna existir);
//   - conta criada antes de EXISTING_ACCOUNTS_BEFORE.
//  Em caso de dúvida (data em falta ou inválida), a conta é tratada como amiga.
// =============================================================================

/** Contas criadas antes deste instante são dos utilizadores que já existiam. */
export const EXISTING_ACCOUNTS_BEFORE = new Date("2026-11-27T14:00:00.000Z");

export type AudienceUser = {
  createdAt: Date;
  planSource?: string | null;
};

export function isFounderAccount(user: AudienceUser): boolean {
  if (user.planSource === "founder") return true;
  const created = user.createdAt?.getTime?.();
  if (created === undefined || Number.isNaN(created)) return true;
  return created < EXISTING_ACCOUNTS_BEFORE.getTime();
}

/** Visitantes anónimos e contas novas veem as novidades; os amigos não. */
export function seesNewExperience(user: AudienceUser | null): boolean {
  return user === null || !isFounderAccount(user);
}
