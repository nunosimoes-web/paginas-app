"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createInviteCode } from "@/app/[locale]/(app)/therapist/actions";
import { styles } from "@/components/ui";

export function GenerateCodeButton() {
  const t = useTranslations("therapist");
  const c = useTranslations("common");
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await createInviteCode();
            if ("ok" in r) {
              setCode(r.code);
              router.refresh();
            }
          })
        }
        className={styles.btnPrimary}
      >
        {pending ? c("loading") : t("generateCode")}
      </button>

      {code ? (
        <div className="rounded-xl border border-accent bg-accent-soft p-4">
          <p className="text-xs font-medium tracking-wide text-accent-strong uppercase">
            {t("newCode")}
          </p>
          <p className="mt-1 font-serif text-2xl tracking-wider text-ink">
            {code}
          </p>
          <p className="mt-1 text-sm text-muted">{t("codeHelp")}</p>
        </div>
      ) : null}
    </div>
  );
}
