import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { TodayExtra } from "@/lib/first-week";
import { QuickCheckin } from "@/components/QuickCheckin";
import { CrisisContacts } from "@/components/CrisisContacts";
import { Card, styles } from "@/components/ui";

/**
 * Uma única sugestão por baixo da peça de hoje. Quem decide é `todayExtra`
 * (lib/first-week.ts); para as contas dos amigos o valor é sempre null.
 */
export function TodayCompanion({
  extra,
  pieceId,
}: {
  extra: TodayExtra;
  pieceId: string | null;
}) {
  const t = useTranslations("companion");
  if (!extra) return null;

  const writeHref = pieceId
    ? { pathname: "/journal", query: { piece: pieceId } }
    : "/journal";

  if (extra.kind === "first-steps") {
    return (
      <Card as="section" className="space-y-4 p-6">
        <div className="space-y-1">
          <h2 className="font-serif text-lg text-ink">{t("stepsTitle")}</h2>
          <p className="text-sm text-muted">{t("stepsBody")}</p>
        </div>
        <ol className="space-y-2 text-sm">
          {extra.steps.map((s) => (
            <li key={s.key} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                  s.done
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-line"
                }`}
              >
                {s.done ? "✓" : ""}
              </span>
              <span className={s.done ? "text-muted" : "text-ink"}>
                {t(`step_${s.key}`)}
                {s.done ? (
                  <span className="sr-only"> ({t("stepDone")})</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
        {extra.next === "checkin" ? (
          <>
            <QuickCheckin />
            <CrisisContacts compact />
          </>
        ) : null}
        {extra.next === "write" ? (
          <Link href={writeHref} className={`${styles.btnGhost} w-fit`}>
            {t("writeCta")}
          </Link>
        ) : null}
      </Card>
    );
  }

  if (extra.kind === "welcome-back") {
    return (
      <Card as="section" className="space-y-3 p-6">
        <h2 className="font-serif text-lg text-ink">{t("backTitle")}</h2>
        <p className="text-sm text-muted">{t("backBody")}</p>
        <QuickCheckin />
        <CrisisContacts compact />
      </Card>
    );
  }

  if (extra.kind === "week-recap") {
    return (
      <Card as="section" className="space-y-2 p-6">
        <h2 className="font-serif text-lg text-ink">{t("weekTitle")}</h2>
        <p className="text-sm text-muted">
          {t("weekBody", { days: extra.activeDays, entries: extra.entries })}
        </p>
        <Link
          href="/journey"
          className="inline-block text-sm text-accent-strong underline-offset-4 hover:underline"
        >
          {t("weekCta")}
        </Link>
      </Card>
    );
  }

  return (
    <Card as="section" className="space-y-3 p-6">
      <h2 className="font-serif text-lg text-ink">{t("checkinTitle")}</h2>
      <QuickCheckin />
      <CrisisContacts compact />
    </Card>
  );
}
