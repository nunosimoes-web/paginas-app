import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// O stripe-seed-test tem de recusar chaves LIVE para garantir que ninguém
// cria produtos/preços reais por acidente durante o preview.

const SCRIPT = resolve(__dirname, "..", "scripts", "stripe-seed-test.mjs");

describe("stripe-seed-test.mjs", () => {
  it("recusa chaves sk_live_", () => {
    const res = spawnSync("node", [SCRIPT], {
      env: { ...process.env, STRIPE_SECRET_KEY: "sk_live_abc123" },
      encoding: "utf8",
    });
    expect(res.status).toBe(3);
    expect(res.stderr).toMatch(/LIVE/);
  });

  it("recusa chaves rk_live_", () => {
    const res = spawnSync("node", [SCRIPT], {
      env: { ...process.env, STRIPE_SECRET_KEY: "rk_live_xyz999" },
      encoding: "utf8",
    });
    expect(res.status).toBe(3);
  });

  it("falha se não houver chave nenhuma", () => {
    const env = { ...process.env };
    delete env.STRIPE_SECRET_KEY;
    const res = spawnSync("node", [SCRIPT], { env, encoding: "utf8" });
    expect(res.status).toBe(2);
  });

  it("recusa chaves que não sejam de teste reconhecíveis", () => {
    const res = spawnSync("node", [SCRIPT], {
      env: { ...process.env, STRIPE_SECRET_KEY: "sk_unknown_foo" },
      encoding: "utf8",
    });
    expect(res.status).toBe(4);
  });
});
