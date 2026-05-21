import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { GenerateCodeButton } from "@/components/GenerateCodeButton";
import { Card, PageHeader } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("therapist");
  return { title: t("title") };
}

export default async function TherapistPage({
  params,
}: PageProps<"/[locale]/therapist">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  if (user.role !== "THERAPIST") redirect({ href: "/today", locale });

  const activeLocale = await getLocale();
  const t = await getTranslations("therapist");

  const links = await prisma.clientLink.findMany({
    where: { therapistId: user.id },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
  const pending = links.filter((l) => l.status === "pending");
  const active = links.filter((l) => l.status === "active");

  return (
    <div className="space-y-8">
      <PageHeader
        kicker={t("title")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <Card className="space-y-4 p-6">
        <GenerateCodeButton />
        <p className="text-xs text-muted">{t("ethicsNote")}</p>
      </Card>

      <section className="space-y-3">
        <h2 className="font-serif text-lg text-ink">{t("activeClients")}</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted">{t("noClients")}</p>
        ) : (
          <ul className="space-y-2.5">
            {active.map((link) => (
              <Card as="li" key={link.id} className="p-4">
                <Link
                  href={`/therapist/${link.id}`}
                  className="flex items-center justify-between gap-3"
                >
                  <span>
                    <span className="block font-medium text-ink">
                      {link.client?.displayName ||
                        link.client?.email ||
                        t("client")}
                    </span>
                    <span className="block text-xs text-muted">
                      {t("clientSince", {
                        when: formatDate(link.createdAt, activeLocale),
                      })}
                    </span>
                  </span>
                  <span className="text-sm text-accent-strong">
                    {t("openClient")} →
                  </span>
                </Link>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {pending.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-lg text-ink">
            {t("pendingInvites")}
          </h2>
          <ul className="space-y-2">
            {pending.map((link) => (
              <li
                key={link.id}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3"
              >
                <span className="font-serif tracking-wider text-ink">
                  {link.inviteCode}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(link.createdAt, activeLocale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
