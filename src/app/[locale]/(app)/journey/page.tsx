import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pickText } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { PieceCard } from "@/components/PieceCard";
import { Card, PageHeader } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("journey");
  return { title: t("title") };
}

export default async function JourneyPage({
  params,
}: PageProps<"/[locale]/journey">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("journey");
  const pt = await getTranslations("pieceType");
  const today = await getTranslations("today");

  const [pieceCount, checkinCount, journalCount, recent] = await Promise.all([
    prisma.promptDelivery.count({ where: { userId: user.id } }),
    prisma.moodCheckIn.count({ where: { userId: user.id } }),
    prisma.journalEntry.count({ where: { userId: user.id } }),
    prisma.promptDelivery.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 5,
      include: { piece: { include: { theme: true } } },
    }),
  ]);

  const stats = [
    { label: t("piecesSeen"), value: pieceCount },
    { label: t("checkinsCount"), value: checkinCount },
    { label: t("journalCount"), value: journalCount },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        kicker={t("title")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <p className="text-sm text-muted">
        {t("since", { when: formatDate(user.createdAt, activeLocale) })}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className="font-serif text-3xl text-accent-strong">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-strong">
        {t("gentleNote")}
      </p>

      <section className="space-y-3">
        <h2 className="font-serif text-lg text-ink">{t("recentPieces")}</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {recent.map((d) => (
              <li key={d.id}>
                <PieceCard
                  compact
                  typeLabel={pt(d.piece.type)}
                  themeLabel={today("themeLabel")}
                  themeName={
                    d.piece.theme
                      ? pickText(d.piece.theme.nameI18n, activeLocale)
                      : null
                  }
                  body={pickText(d.piece.bodyI18n, activeLocale)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
