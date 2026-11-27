"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { PROMPT_HOURS } from "@/lib/content";
import { afterOnboardingPath } from "@/lib/entry";
import { SAMPLE_THEME_KEY } from "@/lib/sample-pieces";
import { styles } from "@/components/ui";
import { completeOnboarding } from "@/app/[locale]/onboarding/actions";

type ThemeOption = { slug: string; name: string };
type Role = "INDIVIDUAL" | "THERAPIST";

const noSubscription = () => () => {};
function readSampleTheme(): string | null {
  try {
    return window.sessionStorage.getItem(SAMPLE_THEME_KEY);
  } catch {
    return null;
  }
}

/** Dois passos: o que te traz, e quando (e se) queres receber a peça. */
export function OnboardingFlow({
  themes,
  defaultRole,
  invite = null,
}: {
  themes: ThemeOption[];
  defaultRole: Role;
  invite?: string | null;
}) {
  const t = useTranslations("onboarding");
  const c = useTranslations("common");
  const locale = useLocale();

  // Tema experimentado na página inicial, se houver: já vem escolhido.
  const sampled = useSyncExternalStore(
    noSubscription,
    readSampleTheme,
    () => null,
  );
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [role, setRole] = useState<Role>(defaultRole);
  const [hour, setHour] = useState<number>(8);
  const [emailDaily, setEmailDaily] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggested = themes.some((th) => th.slug === sampled)
    ? [sampled as string]
    : [];
  const selected = picked ?? suggested;
  const totalSteps = 2;

  function toggleTheme(slug: string) {
    setPicked(
      selected.includes(slug)
        ? selected.filter((s) => s !== slug)
        : [...selected, slug],
    );
  }

  async function finish() {
    if (emailDaily === null) return;
    setError(null);
    setLoading(true);
    try {
      const result = await completeOnboarding({
        themeSlugs: selected,
        role,
        promptHour: hour,
        emailDaily,
      });
      if ("ok" in result) {
        try {
          window.sessionStorage.removeItem(SAMPLE_THEME_KEY);
        } catch {
          // sem armazenamento: nada a limpar
        }
        // Navegação forte (full load): fiável a seguir a uma server action.
        // O router.push suave pode ser descartado na resolução da action,
        // deixando o botão preso em "A guardar".
        const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
        window.location.assign(
          `${prefix}${afterOnboardingPath({ invite }, role)}`,
        );
        return;
      }
      setError(c("somethingWrong"));
    } catch {
      // Qualquer falha (rede, server action) repõe o botão em vez de o deixar preso.
      setError(c("somethingWrong"));
    }
    setLoading(false);
  }

  const choice = (on: boolean) =>
    `rounded-xl border px-4 py-3 text-left text-sm transition ${
      on
        ? "border-accent bg-accent-soft text-accent-strong"
        : "border-line bg-paper text-muted hover:border-accent"
    }`;

  return (
    <div className={`${styles.card} space-y-7 p-7`}>
      <div className="space-y-1.5">
        <h1 className="font-serif text-2xl text-ink">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-accent" : "bg-line"
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <>
          <fieldset className="space-y-3">
            <legend className="space-y-1">
              <span className="block font-medium text-ink">
                {role === "THERAPIST"
                  ? t("stepThemesTitleTherapist")
                  : t("stepThemesTitle")}
              </span>
              <span className="block text-sm text-muted">
                {t("stepThemesHelp")}
              </span>
            </legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {themes.map((theme) => {
                const on = selected.includes(theme.slug);
                return (
                  <button
                    key={theme.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleTheme(theme.slug)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      on
                        ? "border-accent bg-accent-soft text-accent-strong"
                        : "border-line bg-paper text-muted hover:border-accent"
                    }`}
                  >
                    {theme.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={role === "THERAPIST"}
              onChange={(e) =>
                setRole(e.target.checked ? "THERAPIST" : "INDIVIDUAL")
              }
              className="mt-0.5 h-4 w-4 rounded border-line accent-accent-strong"
            />
            <span>
              <span className="block text-ink">{t("roleTherapist")}</span>
              <span className="block text-muted">
                {t("roleTherapistHelp")}
              </span>
            </span>
          </label>
        </>
      )}

      {step === 1 && (
        <>
          <fieldset className="space-y-3">
            <legend className="space-y-1">
              <span className="block font-medium text-ink">
                {t("stepHourTitle")}
              </span>
              <span className="block text-sm text-muted">
                {t("stepHourHelp")}
              </span>
            </legend>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {PROMPT_HOURS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={hour === opt.value}
                  onClick={() => setHour(opt.value)}
                  className={choice(hour === opt.value)}
                >
                  <span className="block font-medium">{t(opt.key)}</span>
                  <span className="block text-xs">{t(`${opt.key}Cue`)}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="space-y-1">
              <span className="block font-medium text-ink">
                {t("stepEmailTitle")}
              </span>
              <span className="block text-sm text-muted">
                {t("stepEmailHelp")}
              </span>
            </legend>
            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={emailDaily === true}
                onClick={() => setEmailDaily(true)}
                className={choice(emailDaily === true)}
              >
                {t("emailYes")}
              </button>
              <button
                type="button"
                aria-pressed={emailDaily === false}
                onClick={() => setEmailDaily(false)}
                className={choice(emailDaily === false)}
              >
                {t("emailNo")}
              </button>
            </div>
          </fieldset>
        </>
      )}

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      {step === 0 && selected.length === 0 ? (
        <p className="text-sm text-muted">{t("pickAtLeastOne")}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep(0)}
          className={`${styles.btnGhost} ${step === 0 ? "invisible" : ""}`}
        >
          {c("back")}
        </button>
        {step === 0 ? (
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => setStep(1)}
            className={styles.btnPrimary}
          >
            {c("continue")}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || emailDaily === null}
            onClick={finish}
            className={styles.btnPrimary}
          >
            {loading
              ? c("saving")
              : role === "THERAPIST"
                ? t("finishTherapist")
                : t("finish")}
          </button>
        )}
      </div>
    </div>
  );
}
