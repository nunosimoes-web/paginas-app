import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, styles } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resetPassword");
  return { title: t("title"), robots: { index: false } };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: PageProps<"/[locale]/reset-password">) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("resetPassword");
  const a = await getTranslations("auth");
  const c = await getTranslations("common");

  const token = typeof sp.token === "string" ? sp.token : "";
  const done = sp.done === "1";
  const error = typeof sp.error === "string" ? sp.error : "";

  const state: "done" | "invalid" | "form" = done
    ? "done"
    : !token || error === "invalid"
      ? "invalid"
      : "form";

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
            {state === "done"
              ? t("done")
              : state === "invalid"
                ? t("invalid")
                : t("subtitle")}
          </p>
        </header>

        {state === "form" ? (
          <form method="POST" action="/api/reset-password" className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="token" value={token} />
            <div className="space-y-1.5">
              <label htmlFor="password" className={styles.label}>
                {a("password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={styles.input}
              />
              <p className="text-xs text-muted">{a("passwordHint")}</p>
            </div>
            {error === "weak" ? (
              <p role="alert" className="text-sm text-clay">
                {a("errorWeakPassword")}
              </p>
            ) : null}
            <button type="submit" className={`${styles.btnPrimary} w-full`}>
              {t("submit")}
            </button>
          </form>
        ) : null}

        <p className="text-sm text-muted">
          <Link
            href="/login"
            className="font-medium text-accent-strong underline-offset-4 hover:underline"
          >
            {state === "done" ? t("toLogin") : t("backToLogin")}
          </Link>
        </p>
      </Card>
    </main>
  );
}
