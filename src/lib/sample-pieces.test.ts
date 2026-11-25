import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SAMPLE_PIECES } from "./sample-pieces";

const data = JSON.parse(
  readFileSync(new URL("../../data/content_365.json", import.meta.url), "utf-8"),
) as { pieces: Array<{ id: string; theme: string; body: Record<string, string> }> };

describe("peças da página inicial", () => {
  it.each(SAMPLE_PIECES)("$id é igual ao conteúdo revisto", (s) => {
    const p = data.pieces.find((x) => x.id === s.id);
    expect(p?.theme).toBe(s.theme);
    expect(s.body["pt-PT"]).toBe(p?.body["pt-PT"]);
    expect(s.body.en).toBe(p?.body.en);
  });
});
