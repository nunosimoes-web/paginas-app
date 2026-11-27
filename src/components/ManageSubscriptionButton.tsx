"use client";

import { useState } from "react";
import { styles } from "./ui";

/** Abre o portal de cliente da Stripe (cancelar, mudar cartão, ver faturas). */
export function ManageSubscriptionButton({
  locale,
  label,
  errorLabel,
}: {
  locale: string;
  label: string;
  errorLabel: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function open() {
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string };
      if (res.ok && body.url) {
        window.location.href = body.url;
        return;
      }
      setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={`${styles.btnGhost} w-fit`} onClick={open} disabled={pending}>
        {pending ? "…" : label}
      </button>
      {error ? <span className="text-sm text-clay">{errorLabel}</span> : null}
    </div>
  );
}
