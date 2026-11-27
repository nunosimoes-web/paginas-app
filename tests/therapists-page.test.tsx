// Página pública /terapeutas e contactos de crise: sem preços, sem marca de
// terceiros, números oficiais (SNS 24 e 112) presentes em PT e EN.
import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import pt from "../src/messages/pt-PT.json";
import en from "../src/messages/en.json";
import { EMERGENCY_TEL, SNS24_TEL } from "../src/components/CrisisContacts";

const MESSAGES = { "pt-PT": pt, en } as const;
type Loc = keyof typeof MESSAGES;
const current = vi.hoisted(() => ({ locale: "pt-PT" as string }));

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) =>
    createTranslator({
      locale: current.locale,
      messages: MESSAGES[current.locale as Loc],
      namespace: namespace as never,
    }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, className }: { href: unknown; children: ReactNode; className?: string }) => (
    <a href={typeof href === "string" ? href : JSON.stringify(href)} className={className}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/PublicHeader", () => ({ PublicHeader: () => null }));

const { default: Therapists } = await import("../src/app/[locale]/terapeutas/page");

async function render(locale: Loc): Promise<string> {
  current.locale = locale;
  const tree = (await Therapists()) as ReactElement;
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      {tree}
    </NextIntlClientProvider>,
  );
}

const PRICE = /€|\$|\/precos|\/pricing|\bPlus\b|Terapeuta Pro|Assinar|subscri|checkout|stripe|grátis|free\b/i;

describe.each(["pt-PT", "en"] as const)("/terapeutas (%s)", (locale) => {
  it("sem preços nem marcas de terceiros", async () => {
    const out = await render(locale);
    expect(out).not.toMatch(PRICE);
    expect(out).not.toMatch(/gymboree/i);
    expect(out).not.toMatch(/\bOPP\b|Ordem dos Psic|recomendad[oa] por|endorsed|clinically (proven|validated)|clinicamente (comprovad|validad)/i);
  });

  it("mostra contactos de crise oficiais com ligação tel:", async () => {
    const out = await render(locale);
    expect(out).toContain(`href="tel:${SNS24_TEL}"`);
    expect(out).toContain(`href="tel:${EMERGENCY_TEL}"`);
    expect(out).toContain("808 24 24 24");
  });

  it("é honesta sobre o estado do conteúdo e o que o terapeuta vê", async () => {
    const m = MESSAGES[locale].forTherapists;
    const out = await render(locale);
    expect(out).toContain(m.data4);
    expect(out).toContain(m.rowJournal);
    expect(out).toContain(m.kicker);
  });
});

describe("números de crise nos textos", () => {
  it.each(["pt-PT", "en"] as const)("%s: SNS 24 opção 4 e 112", (locale) => {
    const c = MESSAGES[locale].crisis;
    expect(c.sns24).toContain("<tel>808 24 24 24</tel>");
    expect(c.sns24).toMatch(/op(ção|tion) 4/);
    expect(c.emergency).toContain("<tel>112</tel>");
    expect(MESSAGES[locale].landing.faq4a).toContain("808 24 24 24");
  });

  it("o número tel: corresponde ao texto", () => {
    expect(SNS24_TEL).toBe("808 24 24 24".replaceAll(" ", ""));
    expect(EMERGENCY_TEL).toBe("112");
  });
});
