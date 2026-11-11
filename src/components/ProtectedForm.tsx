"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { BotCheck, BotTrap } from "./BotCheck";
import { styles } from "./ui";
export function ProtectedForm({ action, sitekey, locale, submitLabel, children }: {
  action: "support" | "password_reset"; sitekey: string; locale: string; submitLabel: string; children: ReactNode;
}) {
  const [token, setToken] = useState(""); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [resetKey, setResetKey] = useState(0);
  const en = locale === "en";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!token || busy) return;
    setBusy(true); setError("");
    try {
      const form = new FormData(event.currentTarget); form.set("cf-turnstile-response", token);
      const response = await fetch(action === "support" ? "/api/support" : "/api/forgot-password", {
        method: "POST", body: form, headers: { Accept: "application/json" },
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(response.status === 429 ? "rate" : "verification");
      window.location.assign(result.redirectTo);
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "rate"
        ? (en ? "Please wait a few minutes before trying again." : "Espera alguns minutos antes de tentares novamente.")
        : (en ? "We couldn't send this. Please try again, or email hello@mindwink.cognixhub.com." : "Não foi possível enviar. Tenta novamente ou escreve para hello@mindwink.cognixhub.com."));
    } finally { setBusy(false); setToken(""); setResetKey(n => n + 1); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <input type="hidden" name="locale" value={locale} />
    {children}<BotTrap /><BotCheck sitekey={sitekey} action={action} locale={locale} onToken={setToken} resetKey={resetKey} />
    {!sitekey ? <p role="alert">{en ? "Please contact" : "Contacta"} <a href="mailto:hello@mindwink.cognixhub.com">hello@mindwink.cognixhub.com</a></p> : null}
    {error ? <p role="alert" className="text-sm text-clay">{error}</p> : null}
    <button type="submit" disabled={busy || !token} className={`${styles.btnPrimary} w-full`}>{busy ? (en ? "Sending…" : "A enviar…") : submitLabel}</button>
  </form>;
}
