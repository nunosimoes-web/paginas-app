"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { connectWithCode } from "@/app/[locale]/(app)/connect/actions";
import { styles } from "@/components/ui";

export function ConnectForm({ initialCode = "" }: { initialCode?: string }) {
  const t = useTranslations("connect");
  const c = useTranslations("common");
  const router = useRouter();

  const [code, setCode] = useState(initialCode);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await connectWithCode({ code });
      if ("ok" in r) {
        setDone(true);
        router.refresh();
        return;
      }
      if (r.error === "self") setError(t("errorSelf"));
      else if (r.error === "already_linked") setError(t("alreadyLinked"));
      else setError(t("errorInvalid"));
    });
  }

  if (done) {
    return (
      <div className={`${styles.card} space-y-4 p-7`}>
        <p className="font-serif text-lg text-ink">{t("done")}</p>
        <Link href="/today" className={styles.btnPrimary}>
          {c("continue")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`${styles.card} space-y-4 p-7`}>
      <div className="space-y-1.5">
        <label htmlFor="code" className={styles.label}>
          {t("codeLabel")}
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("codePlaceholder")}
          className={`${styles.input} font-serif tracking-wider`}
          autoComplete="off"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!code.trim() || pending}
        className={styles.btnPrimary}
      >
        {pending ? c("loading") : t("submit")}
      </button>
    </form>
  );
}
