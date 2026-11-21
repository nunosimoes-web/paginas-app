import { describe, it, expect } from "vitest";
import { hasPlusAccess, hasTherapistPro, isFounder, showPaywall } from "./plan";

// Regra fixa (Nuno, 20/11): founder vê tudo, nunca vê paywall, nunca é cobrado.
// Testes garantem que a flag planSource="founder" domina plan.

describe("plan: founder", () => {
  const founderFree = { plan: "FREE" as const, planSource: "founder", role: "INDIVIDUAL" as const };
  const founderPlus = { plan: "PLUS" as const, planSource: "founder", role: "INDIVIDUAL" as const };

  it("isFounder identifica correctamente", () => {
    expect(isFounder(founderFree)).toBe(true);
    expect(isFounder({ planSource: "stripe" })).toBe(false);
    expect(isFounder({ planSource: null })).toBe(false);
  });

  it("founder tem acesso Plus mesmo com plan FREE", () => {
    expect(hasPlusAccess(founderFree)).toBe(true);
    expect(hasPlusAccess(founderPlus)).toBe(true);
  });

  it("founder nunca vê paywall", () => {
    expect(showPaywall(founderFree)).toBe(false);
  });

  it("founder é tratado como Pro quando o papel o exige", () => {
    expect(
      hasTherapistPro({ plan: "FREE", planSource: "founder", role: "THERAPIST" }),
    ).toBe(true);
  });
});

describe("plan: free e stripe", () => {
  it("free sem planSource não tem acesso Plus", () => {
    expect(
      hasPlusAccess({ plan: "FREE", planSource: null }),
    ).toBe(false);
  });

  it("free vê paywall", () => {
    expect(showPaywall({ plan: "FREE", planSource: null })).toBe(true);
  });

  it("stripe + plan PLUS tem acesso Plus", () => {
    expect(
      hasPlusAccess({ plan: "PLUS", planSource: "stripe" }),
    ).toBe(true);
    expect(
      showPaywall({ plan: "PLUS", planSource: "stripe" }),
    ).toBe(false);
  });

  it("THERAPIST_PRO cobre o lado Plus também", () => {
    expect(
      hasPlusAccess({ plan: "THERAPIST_PRO", planSource: "stripe" }),
    ).toBe(true);
    expect(
      hasTherapistPro({ plan: "THERAPIST_PRO", planSource: "stripe", role: "THERAPIST" }),
    ).toBe(true);
  });
});
