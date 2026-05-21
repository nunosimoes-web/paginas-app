import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { Card, styles } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { description: t("heroSubtitle") };
}

export default async function HomePage() {
  const t = await getTranslations("landing");
  const c = await getTranslations("common");

  const features = [
    { title: t("feature1Title"), body: t("feature1Body") },
    { title: t("feature2Title"), body: t("feature2Body") },
    { title: t("feature3Title"), body: t("feature3Body") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6">
        <section className="space-y-6 py-16 sm:py-24">
          <p className="font-serif text-sm tracking-wide text-accent-strong">
            {c("tagline")}
          </p>
          <h1 className="max-w-2xl font-serif text-4xl leading-tight text-ink sm:text-5xl sm:leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/register" className={styles.btnPrimary}>
              {t("ctaPrimary")}
            </Link>
            <Link href="/login" className={styles.btnGhost}>
              {t("ctaSecondary")}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="space-y-2 p-6">
              <h2 className="font-serif text-lg text-ink">{f.title}</h2>
              <p className="text-sm leading-relaxed text-muted">{f.body}</p>
            </Card>
          ))}
        </section>

        <section className="pb-20">
          <div className="rounded-2xl border border-clay/30 bg-clay/5 p-6">
            <h2 className="font-serif text-lg text-ink">
              {t("disclaimerTitle")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {t("disclaimerBody")}
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-muted">
          <span>
            {c("appName")} — {t("footerRights")}
          </span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">
              {t("footerPrivacy")}
            </Link>
            <Link href="/terms" className="hover:text-ink">
              {t("footerTerms")}
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
