import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { Card, PageHeader, styles } from "@/components/ui";
import { parseInvite } from "@/lib/entry";
import { getCurrentUser } from "@/lib/session";

// Link pessoal: não deve ser indexado. Não consulta a base de dados, por isso
// não revela se um código existe nem a quem pertence.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("invite");
  return {
    title: t("title"),
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function InvitePage({
  params,
}: PageProps<"/[locale]/convite/[code]">) {
  const { locale, code: raw } = await params;
  const code = parseInvite(decodeURIComponent(raw));
  if (!code) notFound();

  const user = await getCurrentUser();
  if (user?.onboardedAt) {
    redirect({ href: { pathname: "/connect", query: { code } }, locale });
  }
  if (user) {
    redirect({
      href: { pathname: "/onboarding", query: { convite: code } },
      locale,
    });
  }

  const t = await getTranslations("invite");
  const query = { convite: code };

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-6 py-12">
        <PageHeader
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <Card className="space-y-4 p-6">
          <h2 className="font-serif text-lg text-ink">{t("canTitle")}</h2>
          <p className="text-sm text-muted">{t("canBody")}</p>
          <h2 className="font-serif text-lg text-ink">{t("cannotTitle")}</h2>
          <p className="text-sm text-muted">{t("cannotBody")}</p>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Link
            href={{ pathname: "/register", query }}
            className={styles.btnPrimary}
          >
            {t("create")}
          </Link>
          <Link
            href={{ pathname: "/login", query }}
            className={styles.btnGhost}
          >
            {t("login")}
          </Link>
        </div>
        <p className="text-xs text-muted">{t("code", { code })}</p>
      </main>
    </div>
  );
}
