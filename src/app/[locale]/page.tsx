import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

// Placeholder da landing — substituído pela versão completa na Fase 9.
export default function Home() {
  const t = useTranslations("landing");
  const c = useTranslations("common");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <p className="font-serif text-sm tracking-wide text-accent-strong">
        {c("appName")}
      </p>
      <h1 className="font-serif text-3xl leading-snug text-ink sm:text-4xl">
        {t("heroTitle")}
      </h1>
      <p className="text-muted">{t("heroSubtitle")}</p>
      <LocaleSwitcher className="self-start" />
    </main>
  );
}
