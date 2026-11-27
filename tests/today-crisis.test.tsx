// O check-in rápido de "Hoje" mostra sempre os contactos de ajuda ao lado.
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import pt from "../src/messages/pt-PT.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useRouter: () => ({ refresh() {} }),
}));
vi.mock("@/app/[locale]/(app)/checkin/actions", () => ({ submitCheckin: async () => ({ ok: true }) }));

const { TodayCompanion } = await import("../src/components/TodayCompanion");

const render = (extra: Parameters<typeof TodayCompanion>[0]["extra"]) =>
  renderToStaticMarkup(
    <NextIntlClientProvider locale="pt-PT" messages={pt}>
      <TodayCompanion extra={extra} pieceId={null} />
    </NextIntlClientProvider>,
  );

describe("Hoje: check-in rápido com contactos de crise", () => {
  it.each([
    { kind: "checkin-nudge" as const },
    { kind: "welcome-back" as const },
    {
      kind: "first-steps" as const,
      next: "checkin" as const,
      steps: [
        { key: "read" as const, done: true },
        { key: "checkin" as const, done: false },
        { key: "write" as const, done: false },
      ],
    },
  ])("$kind", (extra) => {
    const out = render(extra);
    expect(out).toContain('href="tel:808242424"');
    expect(out).toContain('href="tel:112"');
  });

  it("amigos (extra = null) não veem nada", () => {
    expect(render(null)).toBe("");
  });
});
