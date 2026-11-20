import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { BodyMap } from "@/components/BodyMap";
import { Card, PageHeader, styles } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { hasPlusAccess, isFounder } from "@/lib/plan";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("body");
  return { title: t("title"), description: t("intro") };
}

export default async function BodyPage({
  params,
}: PageProps<"/[locale]/corpo">) {
  const { locale } = await params;
  const t = await getTranslations("body");
  const user = await getCurrentUser();
  const plus = user ? hasPlusAccess(user) : false;
  const founder = user ? isFounder(user) : false;

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b border-line">
          <div className="mx-auto w-full max-w-5xl px-6 py-14 space-y-6">
            <PageHeader kicker={t("kicker")} title={t("title")} subtitle={t("intro")} />
            {/* Passo de segurança médica — sempre visível, nunca pago. */}
            <div className="rounded-2xl border border-clay/30 bg-clay/5 p-5 text-sm leading-relaxed text-ink">
              {t("safety")}
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto w-full max-w-5xl px-6 py-12">
            <BodyMap
              locale={locale}
              labels={{
                pickZone: t("pickZone"),
                insightLabel: t("insightLabel"),
                causesLabel: t("causesLabel"),
                solutionsLabel: t("solutionsLabel"),
              }}
            />
          </div>
        </section>

        {!founder ? (
          <section className="border-b border-line bg-surface/40">
            <div className="mx-auto w-full max-w-5xl px-6 py-12">
              <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-serif text-xl text-ink">
                    {t("plusTitle")}
                  </h3>
                  <p className="text-sm text-muted">{t("plusBody")}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {plus ? (
                    <Link href="/corpo/diario" className={styles.btnPrimary}>
                      {t("diaryTitle")}
                    </Link>
                  ) : (
                    <Link href="/precos" className={styles.btnPrimary}>
                      {t("plusCta")}
                    </Link>
                  )}
                </div>
              </Card>
            </div>
          </section>
        ) : null}

        <section>
          <div className="mx-auto w-full max-w-5xl px-6 py-14">
            <p className="text-sm text-muted">{t("footNote")}</p>
          </div>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-7 text-sm text-muted">
          <span>Mindwink · Corpo</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">
              Privacidade
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Termos
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
