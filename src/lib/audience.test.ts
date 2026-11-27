import { describe, expect, it } from "vitest";
import {
  EXISTING_ACCOUNTS_BEFORE,
  isFounderAccount,
  seesNewExperience,
} from "./audience";

const old = new Date("2026-06-13T10:00:00Z");
const fresh = new Date("2026-12-01T10:00:00Z");

describe("audience: amigos (founder)", () => {
  it("planSource founder domina, qualquer que seja a data", () => {
    expect(isFounderAccount({ createdAt: fresh, planSource: "founder" })).toBe(true);
    expect(isFounderAccount({ createdAt: old, planSource: "founder" })).toBe(true);
  });

  it("conta já existente é amiga mesmo sem a coluna planSource (main)", () => {
    expect(isFounderAccount({ createdAt: old })).toBe(true);
    expect(isFounderAccount({ createdAt: old, planSource: null })).toBe(true);
  });

  it("conta nova não é amiga, com ou sem coluna", () => {
    expect(isFounderAccount({ createdAt: fresh })).toBe(false);
    expect(isFounderAccount({ createdAt: fresh, planSource: null })).toBe(false);
    expect(isFounderAccount({ createdAt: fresh, planSource: "stripe" })).toBe(false);
  });

  it("o limite é exclusivo", () => {
    const t = EXISTING_ACCOUNTS_BEFORE.getTime();
    expect(isFounderAccount({ createdAt: new Date(t - 1) })).toBe(true);
    expect(isFounderAccount({ createdAt: new Date(t) })).toBe(false);
  });

  it("na dúvida protege: data inválida ou em falta conta como amiga", () => {
    expect(isFounderAccount({ createdAt: new Date("x") })).toBe(true);
    expect(isFounderAccount({} as { createdAt: Date })).toBe(true);
  });

  it("visitante anónimo e conta nova veem as novidades; amigo não", () => {
    expect(seesNewExperience(null)).toBe(true);
    expect(seesNewExperience({ createdAt: fresh })).toBe(true);
    expect(seesNewExperience({ createdAt: old })).toBe(false);
    expect(seesNewExperience({ createdAt: fresh, planSource: "founder" })).toBe(false);
  });
});
