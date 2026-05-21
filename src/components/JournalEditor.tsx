"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createJournalEntry } from "@/app/[locale]/(app)/journal/actions";
import { styles } from "@/components/ui";

export function JournalEditor({
  pieceId,
  respondingTo,
}: {
  pieceId?: string;
  respondingTo?: string;
}) {
  const t = useTranslations("journal");
  const c = useTranslations("common");
  const router = useRouter();

  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await createJournalEntry({ body, pieceId: pieceId ?? "" });
      if ("ok" in r) {
        setBody("");
        router.refresh();
      } else {
        setError(c("somethingWrong"));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className={`${styles.card} space-y-4 p-6`}>
      {respondingTo ? (
        <div className="rounded-xl bg-accent-soft p-3.5">
          <p className="text-xs font-medium tracking-wide text-accent-strong uppercase">
            {t("respondingTo")}
          </p>
          <p className="mt-1 font-serif text-sm text-ink">{respondingTo}</p>
        </div>
      ) : null}

      <label htmlFor="journal-body" className="sr-only">
        {t("newEntry")}
      </label>
      <textarea
        id="journal-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("placeholder")}
        rows={6}
        maxLength={10000}
        className={`${styles.input} resize-y font-serif leading-relaxed`}
      />

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{t("privateNote")}</p>
        <button
          type="submit"
          disabled={!body.trim() || pending}
          className={styles.btnPrimary}
        >
          {pending ? c("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
