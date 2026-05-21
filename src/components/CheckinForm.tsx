"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { submitCheckin } from "@/app/[locale]/(app)/checkin/actions";
import { styles } from "@/components/ui";

const MOODS = [1, 2, 3, 4, 5] as const;

export function CheckinForm() {
  const t = useTranslations("checkin");
  const c = useTranslations("common");
  const router = useRouter();

  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mood == null) return;
    setError(null);
    startTransition(async () => {
      const r = await submitCheckin({ mood, note });
      if ("ok" in r) {
        setDone(true);
        router.refresh();
      } else {
        setError(c("somethingWrong"));
      }
    });
  }

  if (done) {
    return (
      <div className={`${styles.card} space-y-4 p-7`}>
        <p className="font-serif text-lg text-ink">{t("done")}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setMood(null);
              setNote("");
            }}
            className={styles.btnGhost}
          >
            {t("doAnother")}
          </button>
          <Link href="/today" className={styles.btnPrimary}>
            {t("viewToday")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`${styles.card} space-y-6 p-7`}>
      <fieldset className="space-y-3">
        <legend className="font-medium text-ink">{t("question")}</legend>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => {
            const on = mood === m;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => setMood(m)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-3 text-center transition ${
                  on
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-paper hover:border-accent"
                }`}
              >
                <span className="font-serif text-xl text-ink">{m}</span>
                <span
                  className={`text-[11px] leading-tight ${
                    on ? "text-accent-strong" : "text-muted"
                  }`}
                >
                  {t(`mood${m}`)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="note" className={styles.label}>
          {t("noteLabel")}{" "}
          <span className="font-normal text-muted">({c("optional")})</span>
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("notePlaceholder")}
          rows={3}
          maxLength={2000}
          className={`${styles.input} resize-y`}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={mood == null || pending}
        className={styles.btnPrimary}
      >
        {pending ? c("saving") : t("submit")}
      </button>
    </form>
  );
}
