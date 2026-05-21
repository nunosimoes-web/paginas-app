import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function PublicHeader() {
  const c = await getTranslations("common");
  const nav = await getTranslations("nav");

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-serif text-lg font-medium text-accent-strong"
        >
          {c("appName")}
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <LocaleSwitcher />
          <Link
            href="/login"
            className="text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            {nav("signIn")}
          </Link>
        </div>
      </div>
    </header>
  );
}
