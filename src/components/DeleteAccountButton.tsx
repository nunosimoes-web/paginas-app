"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { deleteAccount } from "@/app/[locale]/(app)/settings/actions";
import { styles } from "@/components/ui";

export function DeleteAccountButton() {
  const t = useTranslations("settings");
  const c = useTranslations("common");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const r = await deleteAccount();
      if (!("ok" in r)) {
        setError(c("somethingWrong"));
        setBusy(false);
        return;
      }
      // Conta apagada — terminar sessão e sair para a página inicial.
      await signOut({ redirect: false }).catch(() => {});
      window.location.assign("/");
    } catch {
      setError(c("somethingWrong"));
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`${styles.btnGhost} w-fit text-clay`}
      >
        {t("deleteAccount")}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-clay">{t("deleteConfirm")}</p>
      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="inline-flex items-center justify-center rounded-full bg-clay px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? c("loading") : t("deleteConfirmYes")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(false)}
          className={styles.btnGhost}
        >
          {c("cancel")}
        </button>
      </div>
    </div>
  );
}
