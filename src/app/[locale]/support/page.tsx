import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { PublicHeader } from "@/components/PublicHeader";
import { Card, styles } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("support");
  return { title: t("title") };
}

export default async function SupportPage({
  params,
  searchParams,
}: PageProps<"/[locale]/support">) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("support");
  const sent = sp.sent === "1";
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
        <Card className="space-y-5 p-7">
          <header className="space-y-1.5">
            <h1 className="font-serif text-2xl text-ink">{t("title")}</h1>
            <p className="text-sm text-muted">
              {sent ? t("sent") : t("subtitle")}
            </p>
          </header>

          {sent ? null : (
            <form method="POST" action="/api/support" className="space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <div className="space-y-1.5">
                <label htmlFor="email" className={styles.label}>
                  {t("emailLabel")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user?.email ?? ""}
                  autoComplete="email"
                  className={styles.input}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="message" className={styles.label}>
                  {t("messageLabel")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  maxLength={5000}
                  className={`${styles.input} resize-y`}
                />
              </div>
              <button type="submit" className={`${styles.btnPrimary} w-full`}>
                {t("submit")}
              </button>
            </form>
          )}

          <p className="text-sm text-muted">
            <Link
              href="/"
              className="font-medium text-accent-strong underline-offset-4 hover:underline"
            >
              {t("backHome")}
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
