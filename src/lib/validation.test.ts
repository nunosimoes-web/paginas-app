import { describe, it, expect } from "vitest";
import {
  registerSchema,
  checkinSchema,
  onboardingSchema,
  connectSchema,
} from "./validation";

describe("registerSchema", () => {
  it("aceita email e palavra-passe válidos", () => {
    const r = registerSchema.safeParse({
      email: "Pessoa@Exemplo.PT",
      password: "umaboapass",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("pessoa@exemplo.pt");
  });

  it("rejeita email inválido", () => {
    expect(
      registerSchema.safeParse({ email: "nao-e-email", password: "umaboapass" })
        .success,
    ).toBe(false);
  });

  it("rejeita palavra-passe com menos de 8 caracteres", () => {
    const r = registerSchema.safeParse({
      email: "pessoa@exemplo.pt",
      password: "curta",
    });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.issues.some((i) => i.path[0] === "password")).toBe(true);
  });
});

describe("checkinSchema", () => {
  it("aceita humor entre 1 e 5", () => {
    expect(checkinSchema.safeParse({ mood: 3 }).success).toBe(true);
  });
  it("rejeita humor fora do intervalo", () => {
    expect(checkinSchema.safeParse({ mood: 0 }).success).toBe(false);
    expect(checkinSchema.safeParse({ mood: 6 }).success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  it("exige pelo menos um tema", () => {
    expect(
      onboardingSchema.safeParse({
        themeSlugs: [],
        role: "INDIVIDUAL",
        promptHour: 8,
      }).success,
    ).toBe(false);
  });
  it("aceita uma escolha completa", () => {
    expect(
      onboardingSchema.safeParse({
        themeSlugs: ["anxiety"],
        role: "THERAPIST",
        promptHour: 21,
      }).success,
    ).toBe(true);
  });
});

describe("connectSchema", () => {
  it("rejeita códigos demasiado curtos", () => {
    expect(connectSchema.safeParse({ code: "AB" }).success).toBe(false);
  });
  it("aceita um código plausível", () => {
    expect(connectSchema.safeParse({ code: "ABCD-2345" }).success).toBe(true);
  });
});
