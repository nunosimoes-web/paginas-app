import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { Card, styles } from "@/components/ui";
import { THERAPIST_PROFILE } from "@/lib/entry";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forTherapists");
  return { title: t("metaTitle"), description: t("intro") };
}

// Página pública para terapeutas. Sem preços. Só afirma o que o código cumpre.
export default async function TherapistsPage() {
  const t = await getTranslations("forTherapists");
  const landing = await getTranslations("landing");

  const steps = [1, 2, 3].map((n) => ({
    n: `0${n}`,
    title: t(`step${n}Title`),
    body: t(`step${n}Body`),
  }));
  const sees = [t("sees1"), t("sees2"), t("sees3")];
  const never = [t("never1"), t("never2"), t("never3")];
  const faq = [1, 2, 3, 4].map((n) => ({ q: t(`q${n}`), a: t(`a${n}`) }));

  const cta = (
    <Link
      href={{ pathname: "/register", query: { perfil: THERAPIST_PROFILE } }}
      className={styles.btnPrimary}
    >
      {t("cta")}
    </Link>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="dawn pointer-events-none absolute inset-x-0 top-0 h-3/4"
          />
          <div className="rise relative mx-auto w-full max-w-3xl space-y-6 px-6 py-16 sm:py-24">
            <p className="font-serif text-sm tracking-wide text-accent-strong">
              {t("kicker")}
            </p>
            <h1 className="font-serif text-4xl leading-[1.13] text-ink">
              {t("title")}
            </h1>
            <p className="text-lg leading-relaxed text-muted">{t("intro")}</p>
            {cta}
          </div>
        </section>

        <section className="border-t border-line bg-surface/40">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <h2 className="font-serif text-2xl text-ink">{t("howTitle")}</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="space-y-2">
                  <span className="block font-serif text-2xl text-accent/60">
                    {s.n}
                  </span>
                  <h3 className="font-serif text-lg text-ink">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <h2 className="font-serif text-2xl text-ink">
              {t("privacyTitle")}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                { title: t("seesTitle"), items: sees },
                { title: t("neverTitle"), items: never },
              ].map((col) => (
                <Card key={col.title} className="space-y-3 p-6">
                  <h3 className="font-serif text-lg text-ink">{col.title}</h3>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
                    {col.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface/40">
          <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-14">
            <h2 className="font-serif text-2xl text-ink">{t("faqTitle")}</h2>
            <dl className="space-y-5">
              {faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-medium text-ink">{f.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="rounded-2xl border border-clay/25 bg-clay/5 p-6">
              <h3 className="font-serif text-lg text-ink">
                {landing("disclaimerTitle")}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {landing("disclaimerBody")}
              </p>
            </div>
            {cta}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-4 px-6 py-7 text-sm text-muted">
          <Link href="/support" className="hover:text-ink">
            {landing("footerSupport")}
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            {landing("footerPrivacy")}
          </Link>
          <Link href="/terms" className="hover:text-ink">
            {landing("footerTerms")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
