import { describe, expect, it } from "vitest";
import {
  dayNumber,
  showsWritingStarters,
  todayExtra,
  type Activity,
} from "./first-week";

const D = (day: number, hour = 10) =>
  new Date(Date.UTC(2026, 11, day, hour));
const none: Activity = { readDays: [], checkIns: [], journalEntries: [] };
const newUser = { createdAt: D(1), onboardedAt: D(1) };

describe("todayExtra: conta nova", () => {
  it("primeiro dia: três passos, começa por ler", () => {
    const r = todayExtra(newUser, none, D(1, 12));
    expect(r).toMatchObject({ kind: "first-steps", next: "read" });
  });

  it("avança para o passo que falta", () => {
    const r = todayExtra(newUser, { ...none, readDays: [D(1, 0)] }, D(1, 12));
    expect(r).toMatchObject({ kind: "first-steps", next: "checkin" });
  });

  it("com os três passos feitos, só sugere o check-in do dia", () => {
    const a = { readDays: [D(1, 0)], checkIns: [D(1)], journalEntries: [D(1)] };
    expect(todayExtra(newUser, a, D(1, 12))).toBeNull();
    expect(todayExtra(newUser, a, D(2, 12))).toEqual({ kind: "checkin-nudge" });
  });

  it("depois do 7.º dia deixa de insistir nos primeiros passos", () => {
    const a = { ...none, readDays: [D(14, 0), D(15, 0)] };
    expect(todayExtra(newUser, a, D(15, 12))).toEqual({ kind: "checkin-nudge" });
  });

  it("acolhe o regresso após 3 dias sem atividade, e só até voltar a agir", () => {
    const a = { ...none, readDays: [D(2, 0)] };
    expect(todayExtra(newUser, a, D(5, 12))).toEqual({ kind: "welcome-back" });
    expect(todayExtra(newUser, a, D(4, 12))?.kind).not.toBe("welcome-back");
    const back = { ...a, checkIns: [D(5, 11)] };
    expect(todayExtra(newUser, back, D(5, 12))?.kind).not.toBe("welcome-back");
  });

  it("mostra a primeira semana do 7.º ao 9.º dia, só com os 7 primeiros dias", () => {
    const a = {
      readDays: [D(1, 0), D(3, 0), D(6, 0), D(8, 0)],
      checkIns: [D(3)],
      journalEntries: [D(6), D(8)],
    };
    expect(todayExtra(newUser, a, D(8, 12))).toEqual({
      kind: "week-recap",
      activeDays: 3,
      entries: 1,
    });
    expect(todayExtra(newUser, a, D(10, 12))?.kind).toBe("checkin-nudge");
  });

  it("sem onboarding não mostra nada", () => {
    expect(todayExtra({ ...newUser, onboardedAt: null }, none, D(1))).toBeNull();
  });

  it("o dia 1 é o do onboarding", () => {
    expect(dayNumber(D(1, 23), D(2, 1))).toBe(2);
    expect(dayNumber(D(3), D(1))).toBe(1);
  });
});

describe("todayExtra: amigos nunca veem nada", () => {
  const activities: Activity[] = [
    none,
    { ...none, readDays: [D(1, 0)] },
    { readDays: [D(1, 0)], checkIns: [D(2)], journalEntries: [D(3)] },
  ];
  const founders = [
    { createdAt: new Date("2026-05-21"), onboardedAt: new Date("2026-05-21") },
    { createdAt: new Date("2026-06-13"), onboardedAt: D(1) },
    { createdAt: D(1), onboardedAt: D(1), planSource: "founder" },
  ];

  it("em nenhuma combinação de dia e atividade", () => {
    for (const u of founders)
      for (const a of activities)
        for (let d = 1; d <= 28; d++)
          expect(todayExtra(u, a, D(d, 12))).toBeNull();
  });

  it("nem inícios de frase no diário", () => {
    for (const u of founders) expect(showsWritingStarters(u, 0)).toBe(false);
    expect(showsWritingStarters(newUser, 0)).toBe(true);
    expect(showsWritingStarters(newUser, 3)).toBe(false);
  });
});
