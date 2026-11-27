import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { SettingsForm } from "@/components/SettingsForm";
import { SignOutButton } from "@/components/SignOutButton";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { Card, PageHeader, styles } from "@/components/ui";
import { ManageSubscriptionButton } from "@/components/ManageSubscriptionButton";
import { isFounder } from "@/lib/plan";
import { stripeConfigured } from "@/lib/stripe";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage({
  params,
}: PageProps<"/[locale]/settings">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const t = await getTranslations("settings");
  const connect = await getTranslations("connect");
  const withdrawal = await getTranslations("withdrawal");
  // Founder (amigos) nunca vê nada de faturação. Os outros, só se já tiverem
  // passado pelo checkout (têm cliente Stripe).
  const showBilling = !isFounder(user) && !!user.stripeCustomerId && stripeConfigured();

  return (
    <div className="space-y-7">
      <PageHeader kicker={t("title")} title={t("title")} />

      <SettingsForm
        initial={{
          displayName: user.displayName ?? "",
          email: user.email,
          promptHour: user.promptHour,
          emailDaily: user.emailDaily,
          role: user.role,
        }}
      />

      {showBilling ? (
        <Card className="space-y-2 p-6">
          <h2 className="font-serif text-lg text-ink">{t("billingTitle")}</h2>
          <p className="text-sm text-muted">{t("billingBody")}</p>
          <ManageSubscriptionButton
            locale={locale}
            label={t("billingManage")}
            errorLabel={t("billingError")}
          />
          <Link href="/retratacao" className="block w-fit text-sm text-muted underline underline-offset-4 hover:text-ink">
            {withdrawal("link")}
          </Link>
        </Card>
      ) : null}

      <Card className="space-y-2 p-6">
        <h2 className="font-serif text-lg text-ink">{connect("title")}</h2>
        <p className="text-sm text-muted">{connect("subtitle")}</p>
        <Link href="/connect" className={`${styles.btnGhost} mt-1 w-fit`}>
          {connect("submit")}
        </Link>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-serif text-lg text-ink">{t("dangerSection")}</h2>
        <p className="text-sm text-muted">{t("dataNote")}</p>
        <SignOutButton className={`${styles.btnGhost} w-fit`} />
        <div className="space-y-3 border-t border-line pt-4">
          <p className="text-sm text-muted">{t("deleteNote")}</p>
          <DeleteAccountButton />
        </div>
      </Card>
    </div>
  );
}
