import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPlusAccess } from "@/lib/plan";
import { Card, PageHeader, styles } from "@/components/ui";
import { PrintTrigger } from "@/components/PrintTrigger";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("journalExport");
  return { title: t("title") };
}

export default async function JournalExportPage({
  params,
}: PageProps<"/[locale]/journal/exportar">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("journalExport");

  if (!hasPlusAccess(user)) {
    return (
      <div className="space-y-6">
        <PageHeader kicker={t("title")} title={t("title")} />
        <Card className="space-y-3 p-6">
          <p className="text-muted">{t("locked")}</p>
          <Link href="/precos" className={`${styles.btnPrimary} w-fit`}>
            {t("title")}
          </Link>
        </Card>
      </div>
    );
  }

  const entries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  const fmt = new Intl.DateTimeFormat(activeLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <PageHeader kicker={t("title")} title={t("title")} subtitle={t("intro")} />
        <PrintTrigger label={t("button")} className={styles.btnPrimary} />
      </div>

      <article className="space-y-6 print:space-y-4">
        <header className="hidden print:block">
          <h1 className="font-serif text-2xl text-ink">
            {user.displayName ?? user.email}
          </h1>
          <p className="text-sm text-muted">Diário · Mindwink</p>
        </header>

        {entries.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted">{t("empty")}</p>
          </Card>
        ) : (
          <ul className="space-y-5">
            {entries.map((e) => (
              <li key={e.id} className="break-inside-avoid">
                <Card className="p-5 print:border-line print:shadow-none">
                  <p className="text-xs tracking-wide text-muted uppercase">
                    {fmt.format(e.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-ink">{e.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
