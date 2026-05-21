import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireOnboardedUser } from "@/lib/session";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const user = await requireOnboardedUser(locale);
  const t = await getTranslations("landing");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav isTherapist={user.role === "THERAPIST"} />
      <main
        id="main"
        className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:py-12"
      >
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-5 text-xs text-muted">
          <span className="max-w-md">{t("disclaimerBody")}</span>
          <span className="flex gap-3">
            <Link href="/privacy" className="hover:text-ink">
              {t("footerPrivacy")}
            </Link>
            <Link href="/terms" className="hover:text-ink">
              {t("footerTerms")}
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
