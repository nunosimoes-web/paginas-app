import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPlusAccess } from "@/lib/plan";
import { Card, PageHeader, styles } from "@/components/ui";


// Fora do componente: a regra react-hooks/purity não aceita Date.now() no render.
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("weekly");
  return { title: t("title") };
}

export default async function WeeklyPage({
  params,
}: PageProps<"/[locale]/semana">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("weekly");

  if (!hasPlusAccess(user)) {
    return (
      <div className="space-y-6">
        <PageHeader kicker={t("title")} title={t("title")} subtitle={t("intro")} />
        <Card className="space-y-3 p-6">
          <p className="text-muted">{t("locked")}</p>
          <Link href="/precos" className={`${styles.btnPrimary} w-fit`}>
            {t("title")}
          </Link>
        </Card>
      </div>
    );
  }

  const sevenDaysAgo = daysAgo(7);

  const [pieces, journal, checkins] = await Promise.all([
    prisma.promptDelivery.count({
      where: { userId: user.id, date: { gte: sevenDaysAgo } },
    }),
    prisma.journalEntry.findMany({
      where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.moodCheckIn.count({
      where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  const fmt = new Intl.DateTimeFormat(activeLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="space-y-7">
      <PageHeader kicker={t("title")} title={t("title")} subtitle={t("intro")} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs tracking-wide text-muted uppercase">
            {t("piecesSeen")}
          </p>
          <p className="mt-2 font-serif text-3xl text-ink">{pieces}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs tracking-wide text-muted uppercase">
            {t("journalEntries")}
          </p>
          <p className="mt-2 font-serif text-3xl text-ink">{journal.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs tracking-wide text-muted uppercase">
            {t("checkIns")}
          </p>
          <p className="mt-2 font-serif text-3xl text-ink">{checkins}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-serif text-lg text-ink">{t("lastEntries")}</h2>
        {journal.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t("empty")}</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {journal.map((e) => (
              <li key={e.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                <p className="text-xs text-muted">{fmt.format(e.createdAt)}</p>
                <p className="mt-1 whitespace-pre-wrap text-ink">
                  {e.body.slice(0, 220)}
                  {e.body.length > 220 ? "…" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
