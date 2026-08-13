import { getTranslations } from "next-intl/server";
import { Card } from "./ui";

/** Secções legais partilhadas por /privacy e /terms.
 *  Nota: conteúdo de arranque — carece de revisão jurídica antes de produção. */
export async function LegalContent() {
  const t = await getTranslations("legal");

  const sections = [
    { heading: t("disclaimerHeading"), body: t("disclaimerBody") },
    { heading: t("rgpdHeading"), body: t("rgpdBody") },
    {
      heading: t("emailTrackingHeading"),
      body: t("emailTrackingBody"),
    },
    { heading: t("contactHeading"), body: t("contactBody") },
  ];

  return (
    <div className="space-y-4">
      <Card className="space-y-2 border-clay/40 bg-clay/5 p-5">
        <h2 className="font-serif text-lg text-ink">{t("crisisHeading")}</h2>
        <p className="text-sm leading-relaxed text-ink">{t("crisisBody")}</p>
      </Card>

      {sections.map((s) => (
        <section key={s.heading} className="space-y-1.5">
          <h2 className="font-serif text-lg text-ink">{s.heading}</h2>
          <p className="leading-relaxed text-muted">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
