import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/PublicHeader";
import { Card, PageHeader, styles } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { isFounder } from "@/lib/plan";
import { stripeConfigured } from "@/lib/stripe";
import { Link } from "@/i18n/navigation";
import { PricingActions } from "@/components/PricingActions";
import { syncCheckoutSession } from "@/lib/stripe-sync";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return { title: t("title"), description: t("intro") };
}

type Tier = {
  key: "free" | "plus" | "pro" | "body";
  name: string;
  tagline: string;
  price: string;
  priceYear?: string;
  perLabel: string;
  items: string[];
  plan?: "plus_month" | "plus_year" | "pro_month" | "body_month" | "body_year";
  highlight?: boolean;
  // Sem checkout: a camada ainda não tem funcionalidades pagas próprias.
  // Terapeuta Pro: nada no código depende de THERAPIST_PRO além do lado pessoal
  // (que o Plus já dá). Corpo: hasPlusAccess já abre o diário do corpo, por isso
  // o Corpo daria o mesmo que o Plus por mais dinheiro. Não se vende até haver
  // diferença real (decisão do Nuno: diferenciar ou fundir no Plus).
  comingSoonNote?: string;
};

type Faq = { q: string; a: string };

export default async function PrecosPage({
  params,
  searchParams,
}: PageProps<"/[locale]/precos">) {
  const { locale } = await params;
  const t = await getTranslations("pricing");
  const user = await getCurrentUser();
  const founder = user ? isFounder(user) : false;
  const canCheckout = stripeConfigured();
  const sp = await searchParams;
  let confirmed = false;
  if (user && !founder && canCheckout && sp?.status === "ok" && typeof sp.session_id === "string") {
    try {
      confirmed = await syncCheckoutSession(sp.session_id, user.id);
    } catch (error) {
      console.error("[precos] sync checkout", error);
    }
  }

  const allTiers: Tier[] = [
    {
      key: "free",
      name: t("free.name"),
      tagline: t("free.tagline"),
      price: t("free.price"),
      perLabel: "",
      items: (t.raw("free.items") as string[]) ?? [],
    },
    {
      key: "plus",
      name: t("plus.name"),
      tagline: t("plus.tagline"),
      price: t("plus.price"),
      priceYear: t("plus.priceYear"),
      perLabel: t("perMonth"),
      items: (t.raw("plus.items") as string[]) ?? [],
      plan: "plus_month",
      highlight: true,
    },
    {
      key: "pro",
      name: t("pro.name"),
      tagline: t("pro.tagline"),
      price: t("pro.price"),
      perLabel: t("perMonth"),
      items: (t.raw("pro.items") as string[]) ?? [],
      plan: "pro_month",
      comingSoonNote: t("pro.comingSoonNote"),
    },
    {
      key: "body",
      name: t("body.name"),
      tagline: t("body.tagline"),
      price: t("body.price"),
      perLabel: t("perMonth"),
      items: (t.raw("body.items") as string[]) ?? [],
      plan: "body_month",
      comingSoonNote: t("body.comingSoonNote"),
    },
  ];
  // Regra fixa: founder (amigos) nunca vê preços.
  const tiers = founder ? [] : allTiers;
  const faq = founder ? [] : ((t.raw("faq") as Faq[]) ?? []);

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b border-line">
          <div className="mx-auto w-full max-w-5xl px-6 py-14">
            <PageHeader kicker={t("kicker")} title={t("title")} subtitle={t("intro")} />
          </div>
        </section>

        {confirmed ? (
          <section className="border-b border-line">
            <div className="mx-auto w-full max-w-5xl px-6 py-6">
              <Card className="p-5">
                <p className="text-ink">{locale === "en" ? "Payment confirmed. Your plan is active." : "Pagamento confirmado. O teu plano está ativo."}</p>
              </Card>
            </div>
          </section>
        ) : null}

        {founder ? (
          <section className="border-b border-line">
            <div className="mx-auto w-full max-w-5xl px-6 py-10">
              <Card className="space-y-2 p-6">
                <h2 className="font-serif text-xl text-ink">{t("founderTitle")}</h2>
                <p className="text-muted">{t("founderBody")}</p>
              </Card>
            </div>
          </section>
        ) : null}

        {founder ? null : (
        <section className="border-b border-line">
          <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <Card
                key={tier.key}
                className={`flex h-full flex-col justify-between p-6 ${
                  tier.highlight ? "ring-1 ring-accent" : ""
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif text-xl text-ink">{tier.name}</h3>
                    <p className="text-sm text-muted">{tier.tagline}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl text-ink">
                      {tier.price}
                    </span>
                    <span className="text-xs text-muted">{tier.perLabel}</span>
                  </div>
                  {tier.priceYear ? (
                    <p className="text-xs text-muted">
                      {tier.priceYear}
                      {t("perYear")}
                    </p>
                  ) : null}
                  <ul className="space-y-2 text-sm text-ink">
                    {tier.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span
                          aria-hidden
                          className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-strong"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5">
                  {tier.key === "free" ? (
                    user ? (
                      <Link href="/today" className={styles.btnGhost}>
                        Mindwink
                      </Link>
                    ) : (
                      <Link href="/register" className={styles.btnGhost}>
                        {t("free.name")}
                      </Link>
                    )
                  ) : founder ? (
                    <p className="text-xs text-muted">—</p>
                  ) : tier.comingSoonNote ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs text-muted">
                        {t("comingSoon")}
                      </span>
                      <p className="text-xs text-muted">{tier.comingSoonNote}</p>
                    </div>
                  ) : canCheckout ? (
                    <PricingActions
                      plan={tier.plan!}
                      planYear={
                        // Corpo: só mensal + relatório avulso (preços aprovados 20/11).
                        tier.key === "plus" ? "plus_year" : undefined
                      }
                      locale={locale}
                      subscribeLabel={t("subscribe")}
                      requireLogin={!user}
                    />
                  ) : (
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs text-muted">
                        {t("comingSoon")}
                      </span>
                      <p className="text-xs text-muted">
                        {t("comingSoonHelp")}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <p className="mx-auto w-full max-w-5xl px-6 pb-10 text-xs leading-relaxed text-muted">
            {t("priceNote")}
          </p>
        </section>

        )}

        {founder ? null : (
        <section className="border-b border-line bg-surface/40">
          <div className="mx-auto w-full max-w-5xl px-6 py-12">
            <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-serif text-lg text-ink">
                  {t("body.reportName")}
                </h3>
                <p className="text-sm text-muted">{t("body.reportTagline")}</p>
                <p className="mt-2 font-serif text-2xl text-ink">
                  {t("body.reportPrice")}{" "}
                  <span className="text-xs text-muted">{t("oneOff")}</span>
                </p>
              </div>
              {founder ? (
                <p className="text-sm text-muted">—</p>
              ) : canCheckout ? (
                <PricingActions
                  plan="body_report"
                  locale={locale}
                  subscribeLabel={t("buyReport")}
                  requireLogin={!user}
                />
              ) : (
                <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                  {t("comingSoon")}
                </span>
              )}
            </Card>
          </div>
        </section>
        )}

        {faq.length > 0 ? (
          <section className="border-b border-line">
            <div className="mx-auto w-full max-w-3xl space-y-5 px-6 py-12">
              <h2 className="font-serif text-2xl text-ink">{t("faqTitle")}</h2>
              <div className="space-y-3">
                {faq.map((item) => (
                  <details key={item.q} className="rounded-2xl border border-line p-5">
                    <summary className="cursor-pointer font-serif text-lg text-ink">{item.q}</summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <div className="mx-auto w-full max-w-5xl px-6 py-14">
            <div className="rounded-2xl border border-clay/25 bg-clay/5 p-6">
              <h3 className="font-serif text-lg text-ink">{t("safetyTitle")}</h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
                {t("safetyBody")}
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-7 text-sm text-muted">
          <span>{t("safety")}</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">
              {locale === "en" ? "Privacy" : "Privacidade"}
            </Link>
            <Link href="/terms" className="hover:text-ink">
              {locale === "en" ? "Terms" : "Termos"}
            </Link>
            <a
              href="https://www.livroreclamacoes.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              {t("complaintsBook")}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
