// Prova, nas páginas reais, que as contas dos amigos (founder) não veem preços,
// upsell nem nada de novo — e que as contas novas veem. Renderiza o componente
// de cada página com a sessão e a base de dados simuladas.
import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import pt from "../src/messages/pt-PT.json";

type TestUser = Record<string, unknown> & { createdAt: Date };
const state = vi.hoisted(() => ({ user: null as unknown }));

vi.mock("next-intl/server", () => ({
  getLocale: async () => "pt-PT",
  getTranslations: async (namespace: string) =>
    createTranslator({
      locale: "pt-PT",
      messages: pt,
      namespace: namespace as never,
    }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
  }: {
    href: string | { pathname: string; query?: Record<string, string> };
    children: ReactNode;
  }) => {
    const url =
      typeof href === "string"
        ? href
        : `${href.pathname}?${new URLSearchParams(href.query)}`;
    return <a href={url}>{children}</a>;
  },
  redirect: ({ href }: { href: unknown }) => {
    throw new Error(`redirect ${JSON.stringify(href)}`);
  },
  usePathname: () => "/today",
  useRouter: () => ({ refresh() {}, replace() {} }),
}));
vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => state.user,
  requireOnboardedUser: async () => state.user,
}));
vi.mock("@/components/PublicHeader", () => ({ PublicHeader: () => null }));
vi.mock("@/components/MarketingConsent", () => ({
  MarketingConsent: () => null,
}));
for (const name of ["today", "checkin", "journal", "therapist"])
  vi.doMock(`@/app/[locale]/(app)/${name}/actions`, () => ({}));
vi.mock("@/lib/engine", () => ({
  selectDailyPiece: async () => ({
    externalId: "x",
    day: 1,
    type: "METAPHOR",
    principle: "p",
    bodyI18n: { "pt-PT": "PECA-DE-HOJE" },
    themeSlug: null,
    relaxations: [],
  }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    promptDelivery: {
      findFirst: async () => ({
        pieceId: "p1",
        opened: false,
        piece: { theme: null },
      }),
      findMany: async () => [],
      count: async () => 0,
    },
    moodCheckIn: {
      findMany: async () => [],
      findFirst: async () => null,
      count: async () => 0,
    },
    journalEntry: { findMany: async () => [], count: async () => 0 },
    clientLink: { findMany: async () => [] },
    contentPiece: { findMany: async () => [], findUnique: async () => null },
  },
}));

const { default: Today } = await import("../src/app/[locale]/(app)/today/page");
const { default: Journal } = await import("../src/app/[locale]/(app)/journal/page");
const { default: Journey } = await import("../src/app/[locale]/(app)/journey/page");
const { default: Therapist } = await import("../src/app/[locale]/(app)/therapist/page");
const { default: Landing } = await import("../src/app/[locale]/page");
const { default: Checkin } = await import("../src/app/[locale]/(app)/checkin/page");

const props = {
  params: Promise.resolve({ locale: "pt-PT" }),
  searchParams: Promise.resolve({}),
};
type Page = (p: never) => Promise<ReactElement>;
const PAGES: Record<string, Page> = {
  today: Today as Page,
  journal: Journal as Page,
  journey: Journey as Page,
  therapist: Therapist as Page,
  landing: Landing as unknown as Page,
  checkin: Checkin as Page,
};

async function html(page: Page, user: TestUser | null): Promise<string> {
  state.user = user;
  const tree = await page(props as never);
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="pt-PT" messages={pt}>
      {tree}
    </NextIntlClientProvider>,
  )
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"');
}

const base = {
  id: "u1",
  email: "pessoa@example.com",
  displayName: "Pessoa",
  role: "THERAPIST",
  onboardedAt: new Date("2026-12-01"),
  promptHour: 8,
  emailDaily: true,
};
const FOUNDERS: Record<string, TestUser> = {
  "conta já existente, sem coluna planSource (main)": {
    ...base,
    createdAt: new Date("2026-06-13"),
  },
  "planSource=founder": {
    ...base,
    createdAt: new Date("2026-12-01"),
    planSource: "founder",
    plan: "FREE",
  },
};
const NEW_USER: TestUser = { ...base, createdAt: new Date("2026-12-01") };

/** Textos que só existem na experiência nova (sem variáveis). */
const pick = (ns: Record<string, unknown>, keys: RegExp) =>
  Object.entries(ns)
    .filter(([k, v]) => keys.test(k) && typeof v === "string")
    .map(([, v]) => v as string)
    .filter((v) => !v.includes("{"));
const NEW_TEXTS = [
  ...pick(pt.companion, /./),
  ...pick(pt.sampler, /./),
  ...pick(pt.journal, /^starter/),
  ...pick(pt.journey, /^start[A-Z]/),
  ...pick(pt.therapist, /^(start|copyLink|linkCopied)/),
  ...pick(pt.landing, /^(heroNoteNew|start|faq|therapistMore)/),
  ...pick(pt.crisis, /^(notUrgent|abroad)$/),
].filter((v) => v.length > 8);

const UPSELL =
  /€|\/precos|\/pricing|\bPlus\b|Terapeuta Pro|Camadas|Assinar|subscri|checkout|stripe/i;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-12-01T12:00:00Z") });
  return () => vi.useRealTimers();
});

describe.each(Object.entries(FOUNDERS))("amigo: %s", (_label, founder) => {
  it.each(Object.keys(PAGES))("/%s sem preços, upsell nem novidades", async (p) => {
    const out = await html(PAGES[p], founder);
    expect(out.length).toBeGreaterThan(200);
    expect(out).not.toMatch(UPSELL);
    for (const text of NEW_TEXTS) expect(out).not.toContain(text);
    expect(out).not.toContain("/terapeutas");
  });

  it("continua a ver a peça e as ações de sempre", async () => {
    const out = await html(PAGES.today, founder);
    expect(out).toContain("PECA-DE-HOJE");
    expect(out).toContain(pt.today.markOpened);
    expect(out).toContain(pt.today.doCheckin);
  });
});

describe("conta nova: o contraste prova que o teste deteta a novidade", () => {
  it.each([
    ["today", pt.companion.stepsTitle],
    ["journal", pt.journal.starter1],
    ["journey", pt.journey.startTitle],
    ["therapist", pt.therapist.startTitle],
    ["landing", pt.sampler.title],
    ["journal", pt.crisis.notUrgent],
    ["checkin", pt.crisis.notUrgent],
  ])("/%s mostra a experiência nova, sem preços", async (p, text) => {
    const out = await html(PAGES[p], NEW_USER);
    expect(out).toContain(text);
    expect(out).not.toMatch(UPSELL);
  });

  it("visitante anónimo vê a página inicial nova", async () => {
    const out = await html(PAGES.landing, null);
    expect(out).toContain(pt.sampler.title);
    expect(out).toContain("/terapeutas");
    expect(out).not.toMatch(UPSELL);
  });
});
