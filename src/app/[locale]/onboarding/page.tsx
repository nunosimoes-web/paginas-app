import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pickText } from "@/lib/content";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("title") };
}

export default async function OnboardingPage({
  params,
}: PageProps<"/[locale]/onboarding">) {
  const { locale } = await params;
  const user = await requireUser(locale);
  if (user.onboardedAt) redirect({ href: "/today", locale });

  const activeLocale = await getLocale();
  const themes = await prisma.theme.findMany({ orderBy: { slug: "asc" } });
  const themeOptions = themes.map((th) => ({
    slug: th.slug,
    name: pickText(th.nameI18n, activeLocale),
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-12">
      <OnboardingFlow themes={themeOptions} defaultRole={user.role} />
    </main>
  );
}
