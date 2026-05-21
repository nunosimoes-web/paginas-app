import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { selectDailyPiece } from "@/lib/engine";
import { dayRangeUTC } from "@/lib/day";
import { pickText } from "@/lib/content";
import { PieceCard } from "@/components/PieceCard";
import { MarkReadButton } from "@/components/MarkReadButton";
import { PageHeader, styles } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("today");
  return { title: t("title") };
}

export default async function TodayPage({
  params,
}: PageProps<"/[locale]/today">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("today");
  const pt = await getTranslations("pieceType");

  // O motor garante (e regista) a peça do dia de forma idempotente.
  const daily = await selectDailyPiece(prisma, user.id);

  const { start, end } = dayRangeUTC();
  const delivery = await prisma.promptDelivery.findFirst({
    where: { userId: user.id, date: { gte: start, lte: end } },
    include: { piece: { include: { theme: true } } },
  });

  const body = pickText(daily.bodyI18n, activeLocale);
  const themeName = delivery?.piece.theme
    ? pickText(delivery.piece.theme.nameI18n, activeLocale)
    : null;
  const relaxed = daily.relaxations.length > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        kicker={t("title")}
        title={
          user.displayName
            ? t("greeting", { name: user.displayName })
            : t("greetingNoName")
        }
        subtitle={t("intro")}
      />

      <PieceCard
        typeLabel={pt(daily.type)}
        themeName={themeName}
        themeLabel={t("themeLabel")}
        body={body}
        footer={
          <div className="flex flex-wrap items-center gap-3">
            <MarkReadButton initialOpened={delivery?.opened ?? false} />
            {delivery ? (
              <Link
                href={{
                  pathname: "/journal",
                  query: { piece: delivery.pieceId },
                }}
                className={styles.btnPrimary}
              >
                {t("writeAbout")}
              </Link>
            ) : null}
          </div>
        }
      />

      {relaxed ? (
        <p className="text-sm text-muted">{t("relaxNote")}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm">
        <Link
          href="/checkin"
          className="text-accent-strong underline-offset-4 hover:underline"
        >
          {t("doCheckin")}
        </Link>
        <p className="text-xs text-muted">{t("needsReviewNote")}</p>
      </div>
    </div>
  );
}
