/** Texto i18n guardado como JSON { "pt-PT": "...", "en": "..." }. */
export function pickText(i18n: unknown, locale: string): string {
  const obj = (i18n ?? {}) as Record<string, string>;
  return obj[locale] ?? obj["pt-PT"] ?? Object.values(obj)[0] ?? "";
}

/** Mapeamento de blocos do dia para a hora preferida da peça. */
export const PROMPT_HOURS = [
  { key: "hourMorning", value: 8 },
  { key: "hourMidday", value: 13 },
  { key: "hourEvening", value: 18 },
  { key: "hourNight", value: 21 },
] as const;
