import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireOnboardedUser } from "@/lib/session";
import { normalizeInviteCode } from "@/lib/invite";
import { ConnectForm } from "@/components/ConnectForm";
import { PageHeader } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("connect");
  return { title: t("title") };
}

export default async function ConnectPage({
  params,
  searchParams,
}: PageProps<"/[locale]/connect">) {
  const { locale } = await params;
  await requireOnboardedUser(locale);
  const t = await getTranslations("connect");

  const sp = await searchParams;
  const codeParam = typeof sp.code === "string" ? sp.code : "";

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("title")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <ConnectForm initialCode={codeParam ? normalizeInviteCode(codeParam) : ""} />
    </div>
  );
}
