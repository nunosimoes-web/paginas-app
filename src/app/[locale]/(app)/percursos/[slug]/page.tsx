import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPlusAccess } from "@/lib/plan";
import { pickText } from "@/lib/content";
import { Card, PageHeader, styles } from "@/components/ui";
import { PieceCard } from "@/components/PieceCard";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/percursos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

export default async function ProgramPage({
  params,
}: PageProps<"/[locale]/percursos/[slug]">) {
  const { locale, slug } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("programs");
  const pt = await getTranslations("today");
  const pieceType = await getTranslations("pieceType");

  if (!hasPlusAccess(user)) {
    redirect({ href: "/precos", locale });
  }

  const program = await prisma.program.findUnique({ where: { slug } });
  if (!program) notFound();

  let enrollment = await prisma.programEnrollment.findUnique({
    where: { userId_programId: { userId: user.id, programId: program.id } },
  });

  if (!enrollment) {
    enrollment = await prisma.programEnrollment.create({
      data: { userId: user.id, programId: program.id },
    });
  }

  const dayIndex = Math.min(daysBetween(enrollment.startedAt, new Date()), program.days - 1);
  const externalId = program.pieceOrder[dayIndex];

  const piece = externalId
    ? await prisma.contentPiece.findUnique({
        where: { externalId },
        include: { theme: true },
      })
    : null;

  const title = pickText(program.titleI18n, activeLocale);
  const summary = pickText(program.summaryI18n, activeLocale);
  const body = piece ? pickText(piece.bodyI18n, activeLocale) : null;
  const themeName = piece?.theme
    ? pickText(piece.theme.nameI18n, activeLocale)
    : null;

  return (
    <div className="space-y-7">
      <PageHeader kicker={t("day", { n: dayIndex + 1 })} title={title} subtitle={summary} />
      <p className="text-sm text-muted">{t("ofDays", { total: program.days })}</p>

      {piece && body ? (
        <PieceCard
          typeLabel={pieceType(piece.type)}
          themeName={themeName}
          themeLabel={pt("themeLabel")}
          body={body}
          footer={
            <Link href="/journal" className={styles.btnGhost}>
              {pt("writeAbout")}
            </Link>
          }
        />
      ) : (
        <Card className="p-6">
          <p className="text-sm text-muted">{t("noPieces")}</p>
        </Card>
      )}

      <div className="border-t border-line pt-5 text-sm">
        <Link href="/percursos" className="text-muted underline-offset-4 hover:text-ink hover:underline">
          ← {t("title")}
        </Link>
      </div>
    </div>
  );
}
