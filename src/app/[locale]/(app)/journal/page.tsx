import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pickText } from "@/lib/content";
import { formatDateTime } from "@/lib/format";
import { JournalEditor } from "@/components/JournalEditor";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";
import { Card, PageHeader } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("journal");
  return { title: t("title") };
}

export default async function JournalPage({
  params,
  searchParams,
}: PageProps<"/[locale]/journal">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("journal");

  const sp = await searchParams;
  const pieceParam = typeof sp.piece === "string" ? sp.piece : undefined;

  let respondingTo: string | undefined;
  if (pieceParam) {
    const piece = await prisma.contentPiece.findUnique({
      where: { id: pieceParam },
    });
    if (piece) respondingTo = pickText(piece.bodyI18n, activeLocale);
  }

  const entries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Carrega o texto das peças a que as entradas respondem.
  const pieceIds = [
    ...new Set(entries.map((e) => e.pieceId).filter((x): x is string => !!x)),
  ];
  const pieces = pieceIds.length
    ? await prisma.contentPiece.findMany({ where: { id: { in: pieceIds } } })
    : [];
  const pieceMap = new Map(
    pieces.map((p) => [p.id, pickText(p.bodyI18n, activeLocale)]),
  );

  return (
    <div className="space-y-7">
      <PageHeader
        kicker={t("title")}
        title={t("newEntry")}
        subtitle={t("subtitle")}
      />

      <JournalEditor pieceId={pieceParam} respondingTo={respondingTo} />

      <section className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <Card as="li" key={entry.id} className="space-y-2 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">
                    {t("entryFrom", {
                      when: formatDateTime(entry.createdAt, activeLocale),
                    })}
                  </p>
                  <DeleteEntryButton id={entry.id} />
                </div>
                {entry.pieceId && pieceMap.has(entry.pieceId) ? (
                  <p className="border-l-2 border-line pl-3 font-serif text-sm text-muted">
                    {pieceMap.get(entry.pieceId)}
                  </p>
                ) : null}
                <p className="font-serif leading-relaxed whitespace-pre-wrap text-ink">
                  {entry.body}
                </p>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
