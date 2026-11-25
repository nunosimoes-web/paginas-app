import { describe, expect, it } from "vitest";
import en from "./en.json";
import pt from "./pt-PT.json";

type Tree = { [k: string]: string | string[] | Tree };
function flat(t: Tree, prefix = ""): Array<[string, string]> {
  return Object.entries(t).flatMap(([k, v]) =>
    typeof v === "string" || Array.isArray(v)
      ? ([[prefix + k, String(v)]] as Array<[string, string]>)
      : flat(v, `${prefix}${k}.`),
  );
}

const PRICE = /€|\bEUR\b|\d+[.,]\d{2}\s?(euros?|\/)/i;
// O único sítio onde pode haver preços é a página de preços.
const MAY_HAVE_PRICES = /^pricing\./;

describe("mensagens", () => {
  it("PT e EN têm as mesmas chaves", () => {
    const keys = (t: unknown) => flat(t as Tree).map(([k]) => k).sort();
    expect(keys(en)).toEqual(keys(pt));
  });

  it.each([
    ["pt-PT", pt],
    ["en", en],
  ])("%s: nenhum texto fora da página de preços mostra um preço", (_l, m) => {
    const found = flat(m as unknown as Tree).filter(
      ([k, v]) => !MAY_HAVE_PRICES.test(k) && PRICE.test(v),
    );
    expect(found).toEqual([]);
  });
});
