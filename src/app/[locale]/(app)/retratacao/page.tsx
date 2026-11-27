import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listContracts } from "@/lib/withdrawal";
import { WithdrawalForm } from "@/components/WithdrawalForm";
import { Card, PageHeader } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("withdrawal");
  return { title: t("title"), robots: { index: false } };
}

// Função de retratação (art. 11.º-A da Diretiva 2011/83/UE). Founder nunca
// tem contratos pagos, por isso vê só a mensagem «sem contratos».
export default async function WithdrawalPage({
  params,
}: PageProps<"/[locale]/retratacao">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const t = await getTranslations("withdrawal");
  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const contracts = listContracts(user, purchases, locale);

  return (
    <div className="space-y-7">
      <PageHeader kicker={t("kicker")} title={t("title")} subtitle={t("intro")} />
      <Card className="p-6">
        {contracts.length === 0 ? (
          <p className="text-sm text-muted">{t("none")}</p>
        ) : (
          <WithdrawalForm
            locale={locale}
            contracts={contracts}
            initialName={user.displayName ?? ""}
            initialEmail={user.email}
            labels={{
              name: t("name"),
              contract: t("contract"),
              email: t("email"),
              confirm: t("confirm"),
              done: t("done"),
              error: t("error"),
            }}
          />
        )}
      </Card>
      <p className="text-xs leading-relaxed text-muted">{t("note")}</p>
    </div>
  );
}
