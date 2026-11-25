/** Normaliza o que o utilizador escreve (maiúsculas, sem espaços). */
export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
