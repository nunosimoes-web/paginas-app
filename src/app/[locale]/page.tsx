import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { styles } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { description: t("heroSubtitle") };
}

export default async function HomePage() {
  const t = await getTranslations("landing");
  const c = await getTranslations("common");

  const features = [
    { n: "01", title: t("feature1Title"), body: t("feature1Body") },
    { n: "02", title: t("feature2Title"), body: t("feature2Body") },
    { n: "03", title: t("feature3Title"), body: t("feature3Body") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* ---- Hero ---- */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-accent-soft/50"
          />
          <div className="relative mx-auto grid w-full max-w-5xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="space-y-6">
              <p className="font-serif text-sm tracking-wide text-accent-strong">
                {c("tagline")}
              </p>
              <h1 className="font-serif text-4xl leading-[1.13] text-ink sm:text-[3.25rem] sm:leading-[1.08]">
                {t("heroTitle")}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted">
                {t("heroSubtitle")}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/register" className={styles.btnPrimary}>
                  {t("ctaPrimary")}
                </Link>
                <Link href="/login" className={styles.btnGhost}>
                  {t("ctaSecondary")}
                </Link>
              </div>
              <p className="text-sm text-muted/80">{t("heroNote")}</p>
            </div>

            {/* Pré-visualização da peça do dia — mostra o produto. */}
            <div className="relative mx-auto w-full max-w-sm lg:mx-0">
              <div
                aria-hidden
                className="absolute -right-3.5 -bottom-3.5 h-full w-full rotate-2 rounded-2xl border border-line bg-surface/70"
              />
              <div className="relative rounded-2xl border border-line bg-surface p-7 shadow-[0_18px_50px_-16px_rgba(47,43,38,0.22)]">
                <p className="text-[11px] font-medium tracking-[0.14em] text-accent-strong uppercase">
                  {t("previewLabel")}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] tracking-[0.08em] text-muted uppercase">
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent-strong">
                    {t("previewType")}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{t("previewTheme")}</span>
                </div>
                <p className="mt-4 font-serif text-xl leading-relaxed text-ink">
                  {t("previewBody")}
                </p>
                <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-sm text-muted">
                  <span
                    aria-hidden
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line text-[10px]"
                  >
                    ✓
                  </span>
                  {t("previewAction")}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Como funciona ---- */}
        <section className="border-t border-line bg-surface/40">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
            <p className="font-serif text-sm tracking-wide text-accent-strong">
              {t("featuresKicker")}
            </p>
            <div className="mt-9 grid gap-9 sm:grid-cols-3">
              {features.map((f) => (
                <div key={f.n} className="space-y-3">
                  <span className="block font-serif text-2xl text-accent/60">
                    {f.n}
                  </span>
                  <h2 className="font-serif text-xl text-ink">{f.title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Para terapeutas ---- */}
        <section className="border-t border-line">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
            <div className="rounded-3xl bg-accent-strong px-8 py-12 sm:px-12">
              <p className="font-serif text-sm tracking-wide text-paper/70">
                {t("therapistKicker")}
              </p>
              <h2 className="mt-3 max-w-xl font-serif text-2xl leading-snug text-paper sm:text-3xl">
                {t("therapistTitle")}
              </h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-paper/80">
                {t("therapistBody")}
              </p>
              <Link
                href="/register"
                className="mt-7 inline-flex items-center rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-accent-strong transition hover:bg-surface"
              >
                {t("therapistCta")}
              </Link>
            </div>
          </div>
        </section>

        {/* ---- Disclaimer ---- */}
        <section className="border-t border-line">
          <div className="mx-auto w-full max-w-5xl px-6 py-14">
            <div className="rounded-2xl border border-clay/25 bg-clay/5 p-6 sm:p-7">
              <h2 className="font-serif text-lg text-ink">
                {t("disclaimerTitle")}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
                {t("disclaimerBody")}
              </p>
            </div>
          </div>
        </section>

        {/* ---- CTA final ---- */}
        <section className="border-t border-line">
          <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
            <h2 className="font-serif text-3xl text-ink sm:text-4xl">
              {t("finalTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
              {t("finalBody")}
            </p>
            <div className="mt-7">
              <Link href="/register" className={styles.btnPrimary}>
                {t("ctaPrimary")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-7 text-sm text-muted">
          <span>
            {c("appName")} — {t("footerRights")}
          </span>
          <span className="flex gap-4">
            <Link href="/support" className="hover:text-ink">
              {t("footerSupport")}
            </Link>
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
