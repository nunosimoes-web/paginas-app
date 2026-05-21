"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { seedThemes } from "@/app/[locale]/(app)/therapist/actions";
import { styles } from "@/components/ui";

type ThemeOption = { slug: string; name: string };

export function SeedThemesForm({
  linkId,
  themes,
  initialSelected,
}: {
  linkId: string;
  themes: ThemeOption[];
  initialSelected: string[];
}) {
  const t = useTranslations("therapist");
  const c = useTranslations("common");
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(slug: string) {
    setDone(false);
    setSelected((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug],
    );
  }

  function save() {
    if (selected.length === 0) return;
    setError(null);
    startTransition(async () => {
      const r = await seedThemes({ clientId: linkId, themeSlugs: selected });
      if ("ok" in r) {
        setDone(true);
        router.refresh();
      } else {
        setError(c("somethingWrong"));
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {themes.map((theme) => {
          const on = selected.includes(theme.slug);
          return (
            <button
              key={theme.slug}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(theme.slug)}
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

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}
      {done ? <p className="text-sm text-accent-strong">{t("seedDone")}</p> : null}

      <button
        type="button"
        disabled={selected.length === 0 || pending}
        onClick={save}
        className={styles.btnPrimary}
      >
        {pending ? c("saving") : t("seedSave")}
      </button>
    </div>
  );
}
