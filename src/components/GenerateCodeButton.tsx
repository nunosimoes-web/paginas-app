"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { useRouter } from "@/i18n/navigation";
import { createInviteCode } from "@/app/[locale]/(app)/therapist/actions";
import { styles } from "@/components/ui";

export function GenerateCodeButton({
  withLink = false,
}: {
  /** Mostra também o link de convite (só contas novas). */
  withLink?: boolean;
}) {
  const t = useTranslations("therapist");
  const c = useTranslations("common");
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const locale = useLocale();

  function inviteLink(value: string): string {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    return `${window.location.origin}${prefix}/convite/${value}`;
  }

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
              setCopied(false);
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
          {withLink ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm break-all text-ink">{inviteLink(code)}</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteLink(code));
                    setCopied(true);
                  } catch {
                    // sem acesso à área de transferência: o link fica visível
                  }
                }}
                className={styles.btnGhost}
              >
                {copied ? t("linkCopied") : t("copyLink")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
