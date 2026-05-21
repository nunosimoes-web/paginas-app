"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** Alterna entre pt-PT e en, preservando a rota atual. */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");
  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: other })}
      className={`text-sm text-muted underline-offset-4 hover:text-ink hover:underline ${className}`}
      aria-label={`Switch language to ${other}`}
    >
      {t("switchTo")}
    </button>
  );
}
