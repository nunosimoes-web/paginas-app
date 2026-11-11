"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { styles } from "@/components/ui";
import { BotCheck, BotTrap } from "./BotCheck";

type Mode = "login" | "register";

export function AuthForm({ mode, sitekey }: { mode: Mode; sitekey: string }) {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "register" && !botToken) return;
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, displayName, "cf-turnstile-response": botToken, website: new FormData(e.currentTarget as HTMLFormElement).get("website") || "" }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.error === "email_taken") setError(t("errorEmailTaken"));
          else if (data.error === "weak_password")
            setError(t("errorWeakPassword"));
          else setError(t("errorGeneric"));
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(t("errorInvalid"));
        setLoading(false);
        return;
      }

      // Navegação forte: fiável a seguir a uma ação assíncrona (o push suave
      // pode ser descartado, deixando o botão preso). O destino real
      // (/today vs /onboarding) é decidido server-side.
      const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      window.location.assign(`${prefix}/today`);
    } catch {
      setError(t("errorGeneric"));
      setLoading(false);
    } finally {
      if (mode === "register") { setBotToken(""); setResetKey(n => n + 1); }
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {mode === "register" ? (
        <div className="space-y-1.5">
          <label htmlFor="displayName" className={styles.label}>
            {t("displayName")}{" "}
            <span className="font-normal text-muted">({c("optional")})</span>
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("displayNamePlaceholder")}
            className={styles.input}
            autoComplete="given-name"
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className={styles.label}>
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className={styles.label}>
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {mode === "register" ? (
          <p className="text-xs text-muted">{t("passwordHint")}</p>
        ) : null}
      </div>

      {mode === "login" ? (
        <p className="text-sm">
          <Link
            href="/forgot-password"
            className="text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            {t("forgotLink")}
          </Link>
        </p>
      ) : null}

      {mode === "register" ? <><BotTrap /><BotCheck sitekey={sitekey} action="register" locale={locale} onToken={setBotToken} resetKey={resetKey} /></> : null}

      {mode === "register" && !sitekey ? <p role="alert" className="text-sm text-clay">{locale === "en" ? "Registration is temporarily unavailable. Contact " : "O registo está temporariamente indisponível. Contacta "}<a href="mailto:hello@mindwink.cognixhub.com">hello@mindwink.cognixhub.com</a>.</p> : null}

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || (mode === "register" && !botToken)}
        className={`${styles.btnPrimary} w-full`}
      >
        {loading
          ? c("loading")
          : mode === "login"
            ? t("submitSignIn")
            : t("submitSignUp")}
      </button>
    </form>
  );
}
