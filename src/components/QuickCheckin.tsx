"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { submitCheckin } from "@/app/[locale]/(app)/checkin/actions";

const MOODS = [1, 2, 3, 4, 5] as const;

/** Check-in de um toque, sem sair do ecrã de hoje. A nota fica para /checkin. */
export function QuickCheckin() {
  const t = useTranslations("checkin");
  const c = useTranslations("common");
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2" role="group" aria-label={t("question")}>
        {MOODS.map((m) => (
          <button
            key={m}
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setFailed(false);
                try {
                  const r = await submitCheckin({ mood: m });
                  if ("ok" in r) router.refresh();
                  else setFailed(true);
                } catch {
                  setFailed(true);
                }
              })
            }
            className="rounded-xl border border-line bg-paper px-1 py-2.5 text-center text-[11px] leading-tight text-muted transition hover:border-accent disabled:opacity-50"
          >
            {t(`mood${m}`)}
          </button>
        ))}
      </div>
      {failed ? (
        <p role="alert" className="text-sm text-clay">
          {c("somethingWrong")}
        </p>
      ) : null}
    </div>
  );
}
