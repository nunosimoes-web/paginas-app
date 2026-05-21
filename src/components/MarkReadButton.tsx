"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { markTodayOpened } from "@/app/[locale]/(app)/today/actions";
import { styles } from "@/components/ui";

export function MarkReadButton({ initialOpened }: { initialOpened: boolean }) {
  const t = useTranslations("today");
  const [opened, setOpened] = useState(initialOpened);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (opened) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-accent-strong">
        <span aria-hidden>✓</span>
        {t("opened")}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await markTodayOpened();
          if ("ok" in r) {
            setOpened(true);
            router.refresh();
          }
        })
      }
      className={styles.btnGhost}
    >
      {t("markOpened")}
    </button>
  );
}
