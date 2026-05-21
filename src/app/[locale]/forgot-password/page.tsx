import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, styles } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forgotPassword");
  return { title: t("title") };
}

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("forgotPassword");
  const a = await getTranslations("auth");
  const c = await getTranslations("common");
  const sent = sp.sent === "1";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <Link
        href="/"
        className="font-serif text-lg font-medium text-accent-strong"
      >
        {c("appName")}
      </Link>

      <Card className="space-y-5 p-7">
        <header className="space-y-1.5">
          <h1 className="font-serif text-2xl text-ink">{t("title")}</h1>
          <p className="text-sm text-muted">
            {sent ? t("sent") : t("subtitle")}
          </p>
        </header>

        {sent ? null : (
          <form method="POST" action="/api/forgot-password" className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <div className="space-y-1.5">
              <label htmlFor="email" className={styles.label}>
                {a("email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={styles.input}
              />
            </div>
            <button type="submit" className={`${styles.btnPrimary} w-full`}>
              {t("submit")}
            </button>
          </form>
        )}

        <p className="text-sm text-muted">
          <Link
            href="/login"
            className="font-medium text-accent-strong underline-offset-4 hover:underline"
          >
            {t("backToLogin")}
          </Link>
        </p>
      </Card>
    </main>
  );
}
