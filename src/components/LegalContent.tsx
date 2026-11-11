import { getLocale, getTranslations } from "next-intl/server";
import { MarketingConsent } from "./MarketingConsent";
import { validGtmId } from "@/lib/marketing-consent";
import { Card } from "./ui";

/** Secções legais partilhadas por /privacy e /terms.
 *  Nota: conteúdo de arranque — carece de revisão jurídica antes de produção. */
export async function LegalContent() {
  const t = await getTranslations("legal");
  const locale = await getLocale();

  const sections = [
    { heading: t("disclaimerHeading"), body: t("disclaimerBody") },
    { heading: t("rgpdHeading"), body: t("rgpdBody") },
    {
      heading: t("emailTrackingHeading"),
      body: t("emailTrackingBody"),
    },
    { heading: t("siteTrackingHeading"), body: t("siteTrackingBody") },
    { heading: locale === "en" ? "Form protection" : "Proteção dos formulários", body: locale === "en"
      ? "Support, registration and password recovery use Cloudflare Turnstile to help prevent automated abuse. Technical challenge data is processed by Cloudflare. The application keeps temporary rate counters with keyed hashes rather than raw IP addresses, email addresses or challenge tokens; expired counters are removed. This protection does not enable advertising tracking."
      : "O suporte, o registo e a recuperação de palavra-passe usam Cloudflare Turnstile para ajudar a prevenir abuso automático. Os dados técnicos do desafio são tratados pela Cloudflare. A aplicação mantém contadores temporários com hashes protegidos por chave, em vez de endereços IP, e-mails ou tokens do desafio em claro; os contadores expirados são removidos. Esta proteção não ativa a medição publicitária." },
    { heading: t("contactHeading"), body: t("contactBody") },
  ];

  return (
    <div className="space-y-4">
      <MarketingConsent containerId={validGtmId(process.env.MARKETING_GTM_ID)} allowTags={false} />
      <Card className="space-y-2 border-clay/40 bg-clay/5 p-5">
        <h2 className="font-serif text-lg text-ink">{t("crisisHeading")}</h2>
        <p className="text-sm leading-relaxed text-ink">{t("crisisBody")}</p>
      </Card>

      <a href={locale === "en" ? "/en#cookie-preferences" : "/#cookie-preferences"} className="inline-block text-sm text-accent-strong underline">{t("cookiePreferences")}</a>

      {sections.map((s) => (
        <section key={s.heading} className="space-y-1.5">
          <h2 className="font-serif text-lg text-ink">{s.heading}</h2>
          <p className="leading-relaxed text-muted">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
