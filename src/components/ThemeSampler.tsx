"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SAMPLE_PIECES, SAMPLE_THEME_KEY } from "@/lib/sample-pieces";
import { styles } from "@/components/ui";

/**
 * Uma peça a sério antes de criar conta. O tema escolhido não vai no URL nem
 * para o servidor: fica neste separador, só para o onboarding o sugerir.
 */
export function ThemeSampler() {
  const t = useTranslations("sampler");
  const locale = useLocale() === "en" ? "en" : "pt-PT";
  const [theme, setTheme] = useState(SAMPLE_PIECES[0].theme);
  const piece =
    SAMPLE_PIECES.find((p) => p.theme === theme) ?? SAMPLE_PIECES[0];

  function choose(slug: string) {
    setTheme(slug);
    try {
      window.sessionStorage.setItem(SAMPLE_THEME_KEY, slug);
    } catch {
      // sem armazenamento: a escolha vale só nesta página
    }
  }

  return (
    <div className="relative rounded-2xl border border-line bg-surface p-7 shadow-[0_18px_50px_-16px_rgba(47,43,38,0.22)]">
      <p className="text-sm font-medium text-ink">{t("title")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SAMPLE_PIECES.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.theme === theme}
            onClick={() => choose(p.theme)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              p.theme === theme
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-line bg-paper text-muted hover:border-accent"
            }`}
          >
            {p.themeName[locale]}
          </button>
        ))}
      </div>
      <p
        aria-live="polite"
        className="mt-5 min-h-[9rem] font-serif text-xl leading-relaxed text-ink"
      >
        {piece.body[locale]}
      </p>
      <div className="mt-5 space-y-2 border-t border-line pt-4">
        <Link href="/register" className={styles.btnPrimary}>
          {t("cta")}
        </Link>
        <p className="text-xs text-muted">{t("note")}</p>
      </div>
    </div>
  );
}
