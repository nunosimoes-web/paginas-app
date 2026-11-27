import { useTranslations } from "next-intl";

// Números oficiais, confirmados na fonte a 2026-11-27:
// https://www.sns24.gov.pt/pt/servico/aconselhamento-psicologico-no-sns-24/
// ("808242424. Depois deve selecionar a opção 4"; 24 h, 7 dias; emergência: 112).
// Antes de mudar um número, volta a confirmar na fonte.
export const SNS24_TEL = "808242424";
export const EMERGENCY_TEL = "112";

/** Contactos de ajuda. O Mindwink não é um serviço de urgência. */
export function CrisisContacts({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("crisis");
  const tel = "font-medium text-ink underline underline-offset-2";

  return (
    <aside
      aria-label={t("title")}
      className={
        compact
          ? "rounded-xl border border-line bg-paper px-4 py-3 text-xs leading-relaxed text-muted"
          : "rounded-2xl border border-clay/25 bg-clay/5 p-6 text-sm leading-relaxed text-muted"
      }
    >
      {compact ? null : (
        <h3 className="mb-1.5 font-serif text-lg text-ink">{t("title")}</h3>
      )}
      <p>
        {t("notUrgent")}{" "}
        {t.rich("sns24", {
          tel: (chunks) => (
            <a href={`tel:${SNS24_TEL}`} className={tel}>
              {chunks}
            </a>
          ),
        })}{" "}
        {t.rich("emergency", {
          tel: (chunks) => (
            <a href={`tel:${EMERGENCY_TEL}`} className={tel}>
              {chunks}
            </a>
          ),
        })}{" "}
        {t("abroad")}
      </p>
    </aside>
  );
}
