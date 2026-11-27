import { describe, expect, it } from "vitest";
import {
  afterAuthPath,
  afterOnboardingPath,
  entryQuery,
  parseEntry,
  parseInvite,
} from "./entry";
import { generateInviteCode } from "./invite";

describe("entrada por convite ou perfil", () => {
  it("aceita os códigos que a app gera, mesmo em minúsculas", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode();
      expect(parseInvite(code.toLowerCase())).toBe(code);
    }
  });

  it("recusa tudo o que não seja um código (sem redirecionamento aberto)", () => {
    for (const bad of [
      "//evil.example",
      "https://evil.example",
      "../today",
      "ABCD-1234/../x",
      "ABCD1234",
      "",
      ["ABCD-2345"],
      undefined,
      "A".repeat(100),
    ])
      expect(parseInvite(bad)).toBeNull();
  });

  it("o convite sobrevive a login, registo e onboarding", () => {
    const e = parseEntry({ convite: "abcd-2345" });
    expect(entryQuery(e)).toEqual({ convite: "ABCD-2345" });
    expect(afterAuthPath(e)).toBe("/convite/ABCD-2345");
    expect(afterOnboardingPath(e, "INDIVIDUAL")).toBe("/convite/ABCD-2345");
  });

  it("terapeuta vai gerar o primeiro convite; os outros vão para a peça", () => {
    const e = parseEntry({ perfil: "terapeuta" });
    expect(afterAuthPath(e)).toBe("/onboarding?perfil=terapeuta");
    expect(afterOnboardingPath(e, "THERAPIST")).toBe("/therapist");
    expect(afterOnboardingPath(e, "INDIVIDUAL")).toBe("/today");
    expect(afterAuthPath(parseEntry({ perfil: "admin" }))).toBe("/today");
  });
});
