import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { AuthScreen } from "@/components/AuthScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signUpTitle") };
}

export default async function RegisterPage({
  params,
}: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (user) redirect({ href: "/today", locale });

  return <AuthScreen mode="register" />;
}
