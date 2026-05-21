"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { styles } from "@/components/ui";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, displayName }),
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

      // O destino (/today vs /onboarding) é decidido server-side em /today.
      router.push("/today");
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
      setLoading(false);
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

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
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
