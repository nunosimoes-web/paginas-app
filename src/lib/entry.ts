// =============================================================================
//  src/lib/entry.ts — por onde a pessoa chegou (convite, perfil de terapeuta).
// -----------------------------------------------------------------------------
//  O registo e o login fazem navegação forte; sem isto, o código de convite
//  perdia-se entre o link do terapeuta e a ligação. Só aceitamos valores de uma
//  forma conhecida, nunca URLs: não há redirecionamento aberto.
// =============================================================================

import { normalizeInviteCode } from "./invite-code";

const INVITE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
export const THERAPIST_PROFILE = "terapeuta";

export type Entry = { invite: string | null; therapist: boolean };

type RawParams = Record<string, string | string[] | undefined>;

export function parseInvite(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 32) return null;
  const code = normalizeInviteCode(value);
  return INVITE_PATTERN.test(code) ? code : null;
}

export function parseEntry(params: RawParams): Entry {
  return {
    invite: parseInvite(params.convite),
    therapist: params.perfil === THERAPIST_PROFILE,
  };
}

/** Query a manter entre /login, /register e /onboarding. */
export function entryQuery(entry: Entry): Record<string, string> {
  if (entry.invite) return { convite: entry.invite };
  if (entry.therapist) return { perfil: THERAPIST_PROFILE };
  return {};
}

/** Destino depois de entrar ou de criar conta (sem prefixo de locale). */
export function afterAuthPath(entry: Entry): string {
  if (entry.invite) return `/convite/${entry.invite}`;
  if (entry.therapist) return `/onboarding?perfil=${THERAPIST_PROFILE}`;
  return "/today";
}

/** Destino depois do onboarding (sem prefixo de locale). */
export function afterOnboardingPath(
  entry: Pick<Entry, "invite">,
  role: "INDIVIDUAL" | "THERAPIST",
): string {
  if (entry.invite) return `/convite/${entry.invite}`;
  return role === "THERAPIST" ? "/therapist" : "/today";
}
