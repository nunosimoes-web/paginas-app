import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("gera um hash diferente da palavra-passe original", async () => {
    const hash = await hashPassword("paginas-secret-123");
    expect(hash).not.toBe("paginas-secret-123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifica a palavra-passe correta", async () => {
    const hash = await hashPassword("paginas-secret-123");
    expect(await verifyPassword("paginas-secret-123", hash)).toBe(true);
  });

  it("rejeita uma palavra-passe errada", async () => {
    const hash = await hashPassword("paginas-secret-123");
    expect(await verifyPassword("palavra-errada", hash)).toBe(false);
  });
});
