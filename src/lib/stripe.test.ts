import { describe, it, expect, beforeEach } from "vitest";
import { isLiveKey, priceIdFor, stripeConfigured } from "./stripe";

describe("stripe: tolerância a env", () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_PLUS_MONTH;
    delete process.env.STRIPE_ALLOW_LIVE_PREVIEW;
  });

  it("sem chave, stripeConfigured devolve false", () => {
    expect(stripeConfigured()).toBe(false);
  });

  it("recusa chave live", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_1234";
    expect(stripeConfigured()).toBe(false);
    expect(isLiveKey(process.env.STRIPE_SECRET_KEY)).toBe(true);
  });

  it("aceita chave live só com a flag de preview isolado", () => {
    process.env.STRIPE_SECRET_KEY = "rk_live_1234";
    expect(stripeConfigured()).toBe(false);
    process.env.STRIPE_ALLOW_LIVE_PREVIEW = "1";
    expect(stripeConfigured()).toBe(true);
    process.env.STRIPE_ALLOW_LIVE_PREVIEW = "true";
    expect(stripeConfigured()).toBe(false);
  });

  it("aceita chave teste", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_1234";
    expect(stripeConfigured()).toBe(true);
  });

  it("priceIdFor devolve null se env ausente", () => {
    expect(priceIdFor("plus_month")).toBeNull();
  });

  it("priceIdFor devolve valor da env certa", () => {
    process.env.STRIPE_PRICE_PLUS_MONTH = "price_abc";
    expect(priceIdFor("plus_month")).toBe("price_abc");
  });
});
