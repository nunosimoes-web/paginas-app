import { describe, expect, it } from "vitest";
import { activation } from "./activation";

const D = (day: number) => new Date(Date.UTC(2026, 11, day, 10));
const ev = (userId: string, ...days: number[]) =>
  days.map((d) => ({ userId, at: D(d) }));

describe("activation D1/D7", () => {
  it("D7 = pelo menos 3 dias ativos nos primeiros 7; D1 = voltou no dia seguinte", () => {
    const r = activation(
      [
        { id: "a", createdAt: D(1) },
        { id: "b", createdAt: D(1) },
      ],
      [...ev("a", 1, 2, 7), ...ev("b", 1, 1, 3, 8)],
      D(20),
    );
    expect(r.d7).toEqual({ eligible: 2, activated: 1 });
    expect(r.d1).toEqual({ eligible: 2, activated: 1 });
  });

  it("só conta contas com a janela fechada", () => {
    const r = activation([{ id: "a", createdAt: D(10) }], ev("a", 10, 11, 12), D(12));
    expect(r.d7.eligible).toBe(0);
    expect(r.d1).toEqual({ eligible: 1, activated: 1 });
  });

  it("os amigos ficam fora do cálculo", () => {
    const r = activation(
      [
        { id: "f", createdAt: new Date("2026-06-13") },
        { id: "g", createdAt: D(1), planSource: "founder" },
      ],
      [...ev("f", 1, 2, 3), ...ev("g", 1, 2, 3)],
      D(20),
    );
    expect(r).toEqual({
      newAccounts: 0,
      d1: { eligible: 0, activated: 0 },
      d7: { eligible: 0, activated: 0 },
    });
  });
});
