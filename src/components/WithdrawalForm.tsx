"use client";

import { useState } from "react";
import { styles } from "./ui";

type Labels = {
  name: string;
  contract: string;
  email: string;
  confirm: string;
  done: string;
  error: string;
};

export function WithdrawalForm({
  locale,
  contracts,
  initialName,
  initialEmail,
  labels,
}: {
  locale: string;
  contracts: Array<{ key: string; label: string }>;
  initialName: string;
  initialEmail: string;
  labels: Labels;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [contract, setContract] = useState(contracts[0]?.key ?? "");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, contract, locale }),
      });
      if (res.ok) setDone(true);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return <p className="text-ink">{labels.done}</p>;
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className={styles.label} htmlFor="w-name">{labels.name}</label>
        <input id="w-name" className={styles.input} required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className={styles.label} htmlFor="w-contract">{labels.contract}</label>
        <select id="w-contract" className={styles.input} value={contract} onChange={(e) => setContract(e.target.value)}>
          {contracts.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={styles.label} htmlFor="w-email">{labels.email}</label>
        <input id="w-email" type="email" className={styles.input} required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={styles.btnPrimary} disabled={pending}>
          {pending ? "…" : labels.confirm}
        </button>
        {error ? <span className="text-sm text-clay">{labels.error}</span> : null}
      </div>
    </form>
  );
}
