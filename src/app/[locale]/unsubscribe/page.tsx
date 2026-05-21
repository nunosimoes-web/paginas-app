import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { styles } from "@/components/ui";
import { verifyUnsub } from "@/lib/unsubscribe";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("unsubscribe");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: PageProps<"/[locale]/unsubscribe">) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("unsubscribe");

  const u = typeof sp.u === "string" ? sp.u : "";
  const tok = typeof sp.t === "string" ? sp.t : "";
  const done = sp.done === "1";
  const invalid = sp.invalid === "1";

  const state: "done" | "invalid" | "confirm" = done
    ? "done"
    : invalid || !verifyUnsub(u, tok)
      ? "invalid"
      : "confirm";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className={`${styles.card} space-y-4 p-7`}>
        <p className="font-serif text-sm tracking-wide text-accent-strong">
          Páginas
        </p>
        <h1 className="font-serif text-2xl text-ink">{t("title")}</h1>

        {state === "done" ? (
          <p className="leading-relaxed text-muted">{t("done")}</p>
        ) : null}

        {state === "invalid" ? (
          <p className="leading-relaxed text-muted">{t("invalid")}</p>
        ) : null}

        {state === "confirm" ? (
          <>
            <p className="leading-relaxed text-muted">{t("prompt")}</p>
            <form method="POST" action="/api/unsubscribe">
              <input type="hidden" name="u" value={u} />
              <input type="hidden" name="t" value={tok} />
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className={styles.btnPrimary}>
                {t("confirm")}
              </button>
            </form>
          </>
        ) : null}

        <Link
          href="/"
          className="inline-block text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          ← {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
