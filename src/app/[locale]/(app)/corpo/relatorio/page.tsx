import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPlusAccess } from "@/lib/plan";
import { Card, PageHeader, styles } from "@/components/ui";
import { PrintTrigger } from "@/components/PrintTrigger";
import { REGIONS } from "@/lib/body-regions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("body");
  return { title: t("reportTitle") };
}

export default async function BodyReportPage({
  params,
}: PageProps<"/[locale]/corpo/relatorio">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("body");

  const hasReport = await prisma.purchase.findFirst({
    where: { userId: user.id, sku: "body_report_30d" },
  });
  const allowed = hasPlusAccess(user) || !!hasReport;

  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader kicker={t("kicker")} title={t("reportTitle")} />
        <Card className="space-y-3 p-6">
          <p className="text-muted">{t("diaryLocked")}</p>
          <Link href="/precos" className={`${styles.btnPrimary} w-fit`}>
            {t("plusCta")}
          </Link>
        </Card>
      </div>
    );
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const entries = await prisma.bodyEntry.findMany({
    where: { userId: user.id, date: { gte: thirtyDaysAgo } },
    orderBy: { date: "asc" },
  });

  const total = entries.length;
  const avg = total ? entries.reduce((s, e) => s + e.intensity, 0) / total : 0;
  const byRegion = entries.reduce<Record<string, { count: number; sum: number }>>(
    (acc, e) => {
      acc[e.region] = acc[e.region] ?? { count: 0, sum: 0 };
      acc[e.region].count += 1;
      acc[e.region].sum += e.intensity;
      return acc;
    },
    {},
  );

  const fmt = new Intl.DateTimeFormat(activeLocale, {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <PageHeader kicker={t("kicker")} title={t("reportTitle")} />
        {total > 0 ? (
          <PrintTrigger label={t("reportPrint")} className={styles.btnPrimary} />
        ) : null}
      </div>

      <header className="hidden print:block">
        <h1 className="font-serif text-2xl text-ink">{t("reportTitle")}</h1>
        <p className="text-sm text-muted">
          {user.displayName ?? user.email} · Mindwink Corpo
        </p>
      </header>

      {total === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted">{t("reportEmpty")}</p>
        </Card>
      ) : (
        <>
          <Card className="p-6 print:border-line print:shadow-none">
            <p className="text-sm text-muted">
              {t("reportSince", {
                when: fmt.format(entries[0].date),
              })}
            </p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs tracking-wide text-muted uppercase">
                  {t("reportTotal")}
                </dt>
                <dd className="font-serif text-2xl text-ink">{total}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-muted uppercase">
                  {t("reportAverage")}
                </dt>
                <dd className="font-serif text-2xl text-ink">
                  {avg.toFixed(1)}/10
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6 print:border-line print:shadow-none">
            <h2 className="font-serif text-lg text-ink">{t("reportByRegion")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {Object.entries(byRegion)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([regionId, stats]) => {
                  const r = REGIONS.find((x) => x.id === regionId);
                  const label = r
                    ? activeLocale === "en"
                      ? r.labelEN
                      : r.labelPT
                    : regionId;
                  return (
                    <li
                      key={regionId}
                      className="flex items-baseline justify-between gap-2 border-t border-line pt-2 first:border-t-0 first:pt-0"
                    >
                      <span className="font-serif text-ink">{label}</span>
                      <span className="text-muted">
                        {stats.count} · ⌀ {(stats.sum / stats.count).toFixed(1)}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-clay/30 bg-clay/5 p-5 text-sm leading-relaxed text-ink">
        {t("safety")}
      </div>
    </div>
  );
}
