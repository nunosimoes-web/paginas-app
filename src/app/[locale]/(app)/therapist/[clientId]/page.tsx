import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pickText } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { SeedThemesForm } from "@/components/SeedThemesForm";
import { Card, PageHeader } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("therapist");
  return { title: t("title") };
}

export default async function SeedClientPage({
  params,
}: PageProps<"/[locale]/therapist/[clientId]">) {
  const { locale, clientId } = await params;
  const user = await requireOnboardedUser(locale);
  if (user.role !== "THERAPIST") redirect({ href: "/today", locale });

  const activeLocale = await getLocale();
  const t = await getTranslations("therapist");

  // [clientId] é o id do ClientLink.
  const link = await prisma.clientLink.findUnique({
    where: { id: clientId },
    include: { client: true },
  });
  if (!link || link.therapistId !== user.id || link.status !== "active") {
    notFound();
  }

  const themes = await prisma.theme.findMany({ orderBy: { slug: "asc" } });
  const themeOptions = themes.map((th) => ({
    slug: th.slug,
    name: pickText(th.nameI18n, activeLocale),
  }));

  const seeded = (link.seededThemes ?? {}) as Record<string, string>;
  const seededSlugs = Object.keys(seeded);
  const lastSeededISO = Object.values(seeded).sort().at(-1);
  const clientName =
    link.client?.displayName || link.client?.email || t("client");

  return (
    <div className="space-y-7">
      <Link
        href="/therapist"
        className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        ← {t("title")}
      </Link>

      <PageHeader
        kicker={t("client")}
        title={t("seedTitle", { name: clientName })}
        subtitle={t("seedHelp")}
      />

      <Card className="space-y-4 p-6">
        <SeedThemesForm
          linkId={link.id}
          themes={themeOptions}
          initialSelected={seededSlugs}
        />
        {lastSeededISO ? (
          <p className="text-xs text-muted">
            {t("lastSeeded", {
              when: formatDate(new Date(lastSeededISO), activeLocale),
            })}
          </p>
        ) : null}
      </Card>

      <p className="text-xs text-muted">{t("ethicsNote")}</p>
    </div>
  );
}
