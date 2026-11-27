"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { styles } from "./ui";

type Props = {
  regions: Array<{ id: string; label: string }>;
  labels: {
    region: string;
    intensity: string;
    note: string;
    submit: string;
    saved: string;
    consent: string;
    consentLink: string;
    error: string;
  };
};

export function BodyEntryForm({ regions, labels }: Props) {
  const router = useRouter();
  const [region, setRegion] = useState(regions[0]?.id ?? "chest");
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  // Consentimento explícito para dados de saúde (RGPD, art. 9.º, n.º 2, al. a)).
  // Pedido em cada registo; o servidor recusa o registo sem ele.
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/body/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, intensity, note, consent }),
      });
      if (!res.ok) {
        setError("err");
        return;
      }
      setDone(true);
      setNote("");
      // O consentimento é dado em cada registo: volta a desmarcar.
      setConsent(false);
      router.refresh();
    } catch {
      setError("err");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className={styles.label} htmlFor="region">
          {labels.region}
        </label>
        <select
          id="region"
          className={styles.input}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={styles.label} htmlFor="intensity">
          {labels.intensity} — {intensity}/10
        </label>
        <input
          id="intensity"
          type="range"
          min={0}
          max={10}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className={styles.label} htmlFor="note">
          {labels.note}
        </label>
        <textarea
          id="note"
          rows={3}
          className={styles.input}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-muted" htmlFor="consent">
        <input
          id="consent"
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          {labels.consent}{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
            {labels.consentLink}
          </Link>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" className={styles.btnPrimary} disabled={pending || !consent}>
          {pending ? "…" : labels.submit}
        </button>
        {done ? <span className="text-sm text-accent-strong">{labels.saved}</span> : null}
        {error ? <span className="text-sm text-clay">{labels.error}</span> : null}
      </div>
    </form>
  );
}
