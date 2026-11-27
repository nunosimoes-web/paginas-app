import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPlusAccess } from "@/lib/plan";
import { Card, PageHeader, styles } from "@/components/ui";
import { BodyEntryForm } from "@/components/BodyEntryForm";
import { REGIONS } from "@/lib/body-regions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("body");
  return { title: t("diaryTitle") };
}

export default async function BodyDiaryPage({
  params,
}: PageProps<"/[locale]/corpo/diario">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("body");

  // Também abre para quem comprou o relatório avulso (temos uma Purchase válida).
  const hasReport = await prisma.purchase.findFirst({
    where: { userId: user.id, sku: "body_report_30d" },
  });
  const allowed = hasPlusAccess(user) || !!hasReport;

  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader kicker={t("kicker")} title={t("diaryTitle")} />
        <Card className="space-y-3 p-6">
          <p className="text-muted">{t("diaryLocked")}</p>
          <Link href="/precos" className={`${styles.btnPrimary} w-fit`}>
            {t("plusCta")}
          </Link>
        </Card>
      </div>
    );
  }

  const entries = await prisma.bodyEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 30,
  });

  const fmt = new Intl.DateTimeFormat(activeLocale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-7">
      <PageHeader kicker={t("kicker")} title={t("diaryTitle")} subtitle={t("diaryIntro")} />

      <Card className="p-6">
        <BodyEntryForm
          regions={REGIONS.map((r) => ({
            id: r.id,
            label: activeLocale === "en" ? r.labelEN : r.labelPT,
          }))}
          labels={{
            region: t("diaryRegion"),
            intensity: t("diaryIntensity"),
            note: t("diaryNote"),
            submit: t("diarySubmit"),
            saved: t("diarySaved"),
            consent: t("diaryConsent"),
            error: t("diaryError"),
          }}
        />
      </Card>

      <section className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted">{t("reportEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => {
              const r = REGIONS.find((x) => x.id === e.region);
              const label = r
                ? activeLocale === "en"
                  ? r.labelEN
                  : r.labelPT
                : e.region;
              return (
                <Card as="li" key={e.id} className="p-4 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-serif text-ink">{label}</span>
                    <span className="text-xs text-muted">{fmt.format(e.date)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {t("diaryIntensity")}: {e.intensity}/10
                  </p>
                  {e.note ? (
                    <p className="mt-2 whitespace-pre-wrap text-ink">{e.note}</p>
                  ) : null}
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <div className="text-sm">
        <Link
          href="/corpo/relatorio"
          className="text-accent-strong underline-offset-4 hover:underline"
        >
          {t("reportTitle")}
        </Link>
      </div>
    </div>
  );
}
