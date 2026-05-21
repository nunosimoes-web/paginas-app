import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthForm } from "./AuthForm";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Card } from "./ui";

export async function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const t = await getTranslations("auth");
  const c = await getTranslations("common");
  const isLogin = mode === "login";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-lg font-medium text-accent-strong"
        >
          {c("appName")}
        </Link>
        <LocaleSwitcher />
      </div>

      <Card className="space-y-6 p-7">
        <header className="space-y-1.5">
          <h1 className="font-serif text-2xl text-ink">
            {isLogin ? t("signInTitle") : t("signUpTitle")}
          </h1>
          <p className="text-sm text-muted">
            {isLogin ? t("signInSubtitle") : t("signUpSubtitle")}
          </p>
        </header>

        <AuthForm mode={mode} />

        <p className="text-sm text-muted">
          {isLogin ? t("noAccount") : t("hasAccount")}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-medium text-accent-strong underline-offset-4 hover:underline"
          >
            {isLogin ? t("goSignUp") : t("goSignIn")}
          </Link>
        </p>
      </Card>
    </main>
  );
}
