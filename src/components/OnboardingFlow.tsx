"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PROMPT_HOURS } from "@/lib/content";
import { styles } from "@/components/ui";
import { completeOnboarding } from "@/app/[locale]/onboarding/actions";

type ThemeOption = { slug: string; name: string };
type Role = "INDIVIDUAL" | "THERAPIST";

export function OnboardingFlow({
  themes,
  defaultRole,
}: {
  themes: ThemeOption[];
  defaultRole: Role;
}) {
  const t = useTranslations("onboarding");
  const c = useTranslations("common");
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [role, setRole] = useState<Role>(defaultRole);
  const [hour, setHour] = useState<number>(8);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;

  function toggleTheme(slug: string) {
    setSelected((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug],
    );
  }

  async function finish() {
    setError(null);
    setLoading(true);
    const result = await completeOnboarding({
      themeSlugs: selected,
      role,
      promptHour: hour,
    });
    if ("ok" in result) {
      router.push("/today");
      router.refresh();
      return;
    }
    setError(c("somethingWrong"));
    setLoading(false);
  }

  const canAdvance = step !== 0 || selected.length > 0;

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
        <fieldset className="space-y-3">
          <legend className="space-y-1">
            <span className="block font-medium text-ink">
              {t("stepThemesTitle")}
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
      )}

      {step === 1 && (
        <fieldset className="space-y-3">
          <legend className="space-y-1">
            <span className="block font-medium text-ink">
              {t("stepRoleTitle")}
            </span>
            <span className="block text-sm text-muted">
              {t("stepRoleHelp")}
            </span>
          </legend>
          <div className="grid gap-2.5 pt-1">
            {(
              [
                {
                  value: "INDIVIDUAL" as Role,
                  title: t("roleIndividual"),
                  help: t("roleIndividualHelp"),
                },
                {
                  value: "THERAPIST" as Role,
                  title: t("roleTherapist"),
                  help: t("roleTherapistHelp"),
                },
              ]
            ).map((opt) => {
              const on = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setRole(opt.value)}
                  className={`rounded-xl border p-4 text-left transition ${
                    on
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-paper hover:border-accent"
                  }`}
                >
                  <span className="block font-medium text-ink">
                    {opt.title}
                  </span>
                  <span className="block text-sm text-muted">{opt.help}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {step === 2 && (
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
            {PROMPT_HOURS.map((opt) => {
              const on = hour === opt.value;
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setHour(opt.value)}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    on
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-line bg-paper text-muted hover:border-accent"
                  }`}
                >
                  {t(opt.key)}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      {step === 0 && selected.length === 0 ? (
        <p className="text-sm text-muted">{t("pickAtLeastOne")}</p>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={`${styles.btnGhost} ${step === 0 ? "invisible" : ""}`}
        >
          {c("back")}
        </button>
        {step < totalSteps - 1 ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setStep((s) => s + 1)}
            className={styles.btnPrimary}
          >
            {c("continue")}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={finish}
            className={styles.btnPrimary}
          >
            {loading ? c("saving") : t("finish")}
          </button>
        )}
      </div>
    </div>
  );
}
