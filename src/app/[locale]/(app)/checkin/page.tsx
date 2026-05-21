import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { CheckinForm } from "@/components/CheckinForm";
import { PageHeader } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkin");
  return { title: t("title") };
}

export default async function CheckinPage({
  params,
}: PageProps<"/[locale]/checkin">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("checkin");

  const last = await prisma.moodCheckIn.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("title")}
        title={t("question")}
        subtitle={t("subtitle")}
      />
      <CheckinForm />
      {last ? (
        <p className="text-sm text-muted">
          {t("lastCheckin", {
            when: formatDateTime(last.createdAt, activeLocale),
          })}
        </p>
      ) : null}
    </div>
  );
}
