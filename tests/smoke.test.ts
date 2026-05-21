// Smoke E2E (HTTP) do caminho feliz — corre contra o servidor local.
// Inicia o servidor com `npm run dev` antes de `npm test`.
// Se o servidor não estiver acessível, o conjunto é ignorado (skip).
import { describe, it, expect } from "vitest";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

class Jar {
  private cookies = new Map<string, string>();
  store(res: Response) {
    const setCookie = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookie) {
      const pair = c.split(";")[0];
      const idx = pair.indexOf("=");
      if (idx > 0)
        this.cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
    }
  }
  header() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function serverUp(): Promise<boolean> {
  try {
    const r = await fetch(BASE + "/", { redirect: "manual" });
    return r.status > 0 && r.status < 500;
  } catch {
    return false;
  }
}

const up = await serverUp();

describe.skipIf(!up)("smoke: caminho feliz", () => {
  const email = `smoke_${Date.now()}@example.com`;
  const password = "paginas-smoke-123";
  const jar = new Jar();

  it("a landing responde em pt-PT e en", async () => {
    const pt = await fetch(BASE + "/", { redirect: "manual" });
    const en = await fetch(BASE + "/en", { redirect: "manual" });
    expect(pt.status).toBe(200);
    expect(en.status).toBe(200);
  });

  it("regista uma conta nova", async () => {
    const res = await fetch(BASE + "/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName: "Smoke" }),
    });
    expect(res.status).toBe(201);
  });

  it("recusa registo duplicado", async () => {
    const res = await fetch(BASE + "/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(409);
  });

  it("inicia sessão por credenciais", async () => {
    const csrfRes = await fetch(BASE + "/api/auth/csrf");
    jar.store(csrfRes);
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

    const loginRes = await fetch(BASE + "/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: jar.header(),
      },
      body: new URLSearchParams({ csrfToken, email, password, json: "true" }),
      redirect: "manual",
    });
    jar.store(loginRes);

    const sessionRes = await fetch(BASE + "/api/auth/session", {
      headers: { Cookie: jar.header() },
    });
    const session = (await sessionRes.json()) as {
      user?: { email?: string; id?: string };
    };
    expect(session.user?.email).toBe(email);
    expect(session.user?.id).toBeTruthy();
  });

  it("acede a rota protegida quando autenticado", async () => {
    const res = await fetch(BASE + "/onboarding", {
      headers: { Cookie: jar.header() },
      redirect: "manual",
    });
    expect(res.status).toBe(200);
  });

  it("um utilizador sem onboarding é encaminhado a partir de /today", async () => {
    const res = await fetch(BASE + "/today", {
      headers: { Cookie: jar.header() },
      redirect: "manual",
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location") ?? "").toContain("/onboarding");
  });

  it("rotas protegidas redirecionam visitantes anónimos", async () => {
    const res = await fetch(BASE + "/onboarding", { redirect: "manual" });
    expect(res.status).toBe(307);
    expect(res.headers.get("location") ?? "").toContain("/login");
  });
});
