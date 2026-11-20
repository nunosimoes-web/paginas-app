"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { styles } from "./ui";

type Props = {
  plan:
    | "plus_month"
    | "plus_year"
    | "pro_month"
    | "body_month"
    | "body_year"
    | "body_report";
  planYear?: "plus_year" | "body_year";
  locale: string;
  subscribeLabel: string;
  requireLogin: boolean;
};

export function PricingActions({
  plan,
  planYear,
  locale,
  subscribeLabel,
  requireLogin,
}: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(target: Props["plan"]) {
    setPending(target);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: target, locale }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "err");
        setPending(null);
        return;
      }
      const { url } = (await res.json()) as { url?: string };
      if (url) window.location.href = url;
      else setError("err");
    } catch {
      setError("err");
    } finally {
      setPending(null);
    }
  }

  if (requireLogin) {
    return (
      <Link
        href={{ pathname: "/login", query: { next: "/precos" } }}
        className={styles.btnPrimary}
      >
        {subscribeLabel}
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={pending !== null}
          onClick={() => go(plan)}
        >
          {pending === plan ? "…" : subscribeLabel}
        </button>
        {planYear ? (
          <button
            type="button"
            className={styles.btnGhost}
            disabled={pending !== null}
            onClick={() => go(planYear)}
          >
            {pending === planYear ? "…" : subscribeLabel + " · anual"}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-clay">Tenta de novo.</p> : null}
    </div>
  );
}
