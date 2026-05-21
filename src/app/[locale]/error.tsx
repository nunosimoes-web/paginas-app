"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { styles } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");
  const locale = useLocale();

  useEffect(() => {
    // Regista no console do browser; o servidor já regista o stack nos logs.
    console.error("Páginas — erro de render:", error);
  }, [error]);

  const supportHref = `${locale === "en" ? "/en" : ""}/support`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-6 py-12 text-center">
      <h1 className="font-serif text-2xl text-ink">{t("title")}</h1>
      <p className="leading-relaxed text-muted">{t("body")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={styles.btnPrimary}>
          {t("retry")}
        </button>
        <a href={supportHref} className={styles.btnGhost}>
          {t("support")}
        </a>
      </div>
    </main>
  );
}
