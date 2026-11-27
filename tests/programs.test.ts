import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROGRAMS, programPieceOrder } from "../prisma/programs";

type Piece = { id: string; theme: string; day: number; body: Record<string, string> };
const raw = JSON.parse(readFileSync(join(process.cwd(), "data/content_365.json"), "utf-8")) as {
  pieces: Piece[];
};

// Palavras que prometem resultado clínico. Os textos de bem-estar não as usam.
const CLAIMS = /\b(cura|curar|tratamento|terapia comprovada|clinicamente|garantid|cure|treat|treatment|clinically|proven|guarantee)/i;

describe("percursos de 21 dias", () => {
  it("têm slugs únicos e 5 percursos", () => {
    const slugs = PROGRAMS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual([
      "anxiety-21",
      "self-criticism-21",
      "transitions-21",
      "loneliness-21",
      "boundaries-21",
    ]);
  });

  it("cada percurso tem 21 peças distintas do seu tema, por ordem do dia", () => {
    const byId = new Map(raw.pieces.map((p) => [p.id, p]));
    for (const def of PROGRAMS) {
      const order = programPieceOrder(raw.pieces, def);
      expect(order, def.slug).toHaveLength(def.days);
      expect(new Set(order).size, def.slug).toBe(def.days);
      const days = order.map((id) => byId.get(id)!.day);
      expect(days, def.slug).toEqual([...days].sort((a, b) => a - b));
      for (const id of order) {
        const piece = byId.get(id)!;
        expect(piece.theme).toBe(def.themeFilter);
        expect(piece.body["pt-PT"]).toBeTruthy();
        expect(piece.body.en).toBeTruthy();
      }
    }
  });

  it("não usa temas sensíveis sem revisão clínica (luto, trauma)", () => {
    const themes = PROGRAMS.map((p) => p.themeFilter);
    expect(themes).not.toContain("grief");
    expect(themes).not.toContain("trauma");
  });

  it("títulos e resumos existem em PT e EN e não prometem resultados clínicos", () => {
    for (const def of PROGRAMS) {
      for (const locale of ["pt-PT", "en"] as const) {
        expect(def.titleI18n[locale]).toBeTruthy();
        expect(def.summaryI18n[locale]).toBeTruthy();
        expect(def.summaryI18n[locale]).not.toMatch(CLAIMS);
        expect(def.summaryI18n[locale]).not.toMatch(/gymboree/i);
      }
    }
  });
});
