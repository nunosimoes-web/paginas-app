"use client";

import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

export function SignOutButton({ className = "" }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <button
      type="button"
      onClick={() =>
        signOut({ callbackUrl: locale === "pt-PT" ? "/" : `/${locale}` })
      }
      className={className}
    >
      {t("signOut")}
    </button>
  );
}
