import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/format";
import { PublicHeader } from "@/components/PublicHeader";
import { LegalContent } from "@/components/LegalContent";

const LAST_UPDATED = new Date("2026-05-21");

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("privacyTitle") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const locale = await getLocale();

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-12">
        <header className="space-y-1">
          <h1 className="font-serif text-3xl text-ink">{t("privacyTitle")}</h1>
          <p className="text-sm text-muted">
            {t("lastUpdated", { date: formatDate(LAST_UPDATED, locale) })}
          </p>
        </header>
        <LegalContent />
      </main>
    </>
  );
}
