"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";

export function SignOutButton({ className = "" }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    const target = locale === routing.defaultLocale ? "/" : `/${locale}`;
    try {
      // redirect:false — destrói a sessão e devolve o controlo aqui.
      await signOut({ redirect: false });
    } catch {
      // ignora: a navegação forte abaixo garante a saída de qualquer forma.
    }
    // Navegação forte: fiável onde o redirect interno do signOut falhava,
    // deixando o utilizador preso na área autenticada.
    window.location.assign(target);
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className={className}
    >
      {t("signOut")}
    </button>
  );
}
