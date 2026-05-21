"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PROMPT_HOURS } from "@/lib/content";
import { updateSettings } from "@/app/[locale]/(app)/settings/actions";
import { styles } from "@/components/ui";

type Role = "INDIVIDUAL" | "THERAPIST";

export function SettingsForm({
  initial,
}: {
  initial: {
    displayName: string;
    email: string;
    promptHour: number;
    role: Role;
  };
}) {
  const t = useTranslations("settings");
  const c = useTranslations("common");
  const ob = useTranslations("onboarding");
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [locale, setLocale] = useState(currentLocale);
  const [promptHour, setPromptHour] = useState(initial.promptHour);
  const [role, setRole] = useState<Role>(initial.role);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r = await updateSettings({ displayName, locale, promptHour, role });
      if (!("ok" in r)) {
        setError(c("somethingWrong"));
        return;
      }
      if (locale !== currentLocale) {
        router.replace(pathname, { locale });
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className={`${styles.card} space-y-4 p-6`}>
        <h2 className="font-serif text-lg text-ink">{t("accountSection")}</h2>

        <div className="space-y-1.5">
          <label htmlFor="displayName" className={styles.label}>
            {t("displayName")}
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            className={styles.input}
          />
        </div>

        <div className="space-y-1.5">
          <label className={styles.label}>{t("email")}</label>
          <p className="text-sm text-muted">{initial.email}</p>
        </div>
      </section>

      <section className={`${styles.card} space-y-4 p-6`}>
        <h2 className="font-serif text-lg text-ink">
          {t("preferencesSection")}
        </h2>

        <div className="space-y-1.5">
          <label htmlFor="language" className={styles.label}>
            {t("language")}
          </label>
          <select
            id="language"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className={styles.input}
          >
            <option value="pt-PT">Português</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="promptHour" className={styles.label}>
            {t("promptHour")}
          </label>
          <select
            id="promptHour"
            value={promptHour}
            onChange={(e) => setPromptHour(Number(e.target.value))}
            className={styles.input}
          >
            {PROMPT_HOURS.map((h) => (
              <option key={h.key} value={h.value}>
                {ob(h.key)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="role" className={styles.label}>
            {t("role")}
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={styles.input}
          >
            <option value="INDIVIDUAL">{t("roleIndividual")}</option>
            <option value="THERAPIST">{t("roleTherapist")}</option>
          </select>
        </div>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-sm text-accent-strong">{t("saved")}</p> : null}

      <button type="submit" disabled={pending} className={styles.btnPrimary}>
        {pending ? c("saving") : c("save")}
      </button>
    </form>
  );
}
