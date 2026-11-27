import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { parseEntry } from "@/lib/entry";
import { AuthScreen } from "@/components/AuthScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signInTitle") };
}

export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  const user = await getCurrentUser();
  const entry = parseEntry(await searchParams);
  if (user) {
    redirect({
      href: entry.invite ? `/convite/${entry.invite}` : "/today",
      locale,
    });
  }

  return <AuthScreen mode="login" entry={entry} />;
}
