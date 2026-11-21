import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { getCurrentUser } from "@/lib/session";
import { isFounder } from "@/lib/plan";

export async function PublicHeader() {
  const c = await getTranslations("common");
  const nav = await getTranslations("nav");
  const landing = await getTranslations("landing");
  // Regra fixa: founder (amigos) não vê a entrada de preços.
  const user = await getCurrentUser().catch(() => null);
  const founder = user ? isFounder(user) : false;

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="font-serif text-lg font-medium text-accent-strong"
        >
          {c("appName")}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/corpo" className="hover:text-ink">
            {landing("navBody")}
          </Link>
          {founder ? null : (
            <Link href="/precos" className="hover:text-ink">
              {landing("navPricing")}
            </Link>
          )}
        </nav>
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
