import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPlusAccess } from "@/lib/plan";
import { pickText } from "@/lib/content";
import { Card, PageHeader, styles } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("programs");
  return { title: t("title") };
}

export default async function ProgramsPage({
  params,
}: PageProps<"/[locale]/percursos">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("programs");

  const programs = await prisma.program.findMany({
    orderBy: { createdAt: "asc" },
    include: { enrollments: { where: { userId: user.id } } },
  });

  const plus = hasPlusAccess(user);

  return (
    <div className="space-y-7">
      <PageHeader kicker={t("kicker")} title={t("title")} subtitle={t("intro")} />

      {!plus ? (
        <Card className="space-y-3 p-6">
          <p className="text-sm text-muted">{t("locked")}</p>
          <Link href="/precos" className={`${styles.btnPrimary} w-fit`}>
            {t("upsell")}
          </Link>
        </Card>
      ) : null}

      <ul className="space-y-4">
        {programs.map((p) => {
          const title = pickText(p.titleI18n, activeLocale);
          const summary = pickText(p.summaryI18n, activeLocale);
          const enrollment = p.enrollments[0];
          return (
            <li key={p.id}>
              <Card className="space-y-3 p-6">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="font-serif text-xl text-ink">{title}</h2>
                  <span className="text-xs text-muted">
                    {t("ofDays", { total: p.days })}
                  </span>
                </div>
                <p className="text-sm text-muted">{summary}</p>
                {plus ? (
                  <Link
                    href={`/percursos/${p.slug}`}
                    className={`${styles.btnPrimary} w-fit`}
                  >
                    {enrollment ? t("continue") : t("start")}
                  </Link>
                ) : null}
                {enrollment ? (
                  <p className="text-xs text-muted">
                    {t("startedOn", {
                      when: enrollment.startedAt.toISOString().slice(0, 10),
                    })}
                  </p>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
