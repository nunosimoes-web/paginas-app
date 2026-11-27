import { describe, it, expect, vi, beforeEach } from "vitest";
import { listContracts } from "@/lib/withdrawal";

const prismaMock = {
  user: { findUnique: vi.fn() },
  purchase: { findMany: vi.fn() },
};
const sendEmail = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email", () => ({ sendEmail }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1" } })),
}));

const { POST } = await import("./route");

function req(body: unknown) {
  return new Request("http://localhost/api/withdrawal", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const valid = { name: "Ana", email: "ana@example.com", contract: "plan:PLUS", locale: "pt-PT" };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findUnique.mockResolvedValue({ id: "u1", plan: "PLUS", planSource: "stripe" });
  prismaMock.purchase.findMany.mockResolvedValue([]);
  sendEmail.mockResolvedValue(undefined);
});

describe("listContracts", () => {
  it("founder nunca tem contratos (não vê nada de pagamento)", () => {
    expect(listContracts({ plan: "PLUS", planSource: "founder" }, [], "pt-PT")).toEqual([]);
  });

  it("lista a assinatura e as compras avulsas", () => {
    const out = listContracts(
      { plan: "PLUS", planSource: "stripe" },
      [{ id: "p1", sku: "body_report_30d", createdAt: new Date("2026-11-20T10:00:00Z") }],
      "pt-PT",
    );
    expect(out.map((c) => c.key)).toEqual(["plan:PLUS", "purchase:p1"]);
    expect(out[1].label).toContain("2026-11-20");
  });

  it("FREE sem compras não tem contratos", () => {
    expect(listContracts({ plan: "FREE", planSource: null }, [], "en")).toEqual([]);
  });
});

describe("POST /api/withdrawal", () => {
  it("envia a declaração à equipa e a confirmação ao consumidor", async () => {
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[1][0].to).toBe("ana@example.com");
  });

  it("founder recebe 409 e não se envia nada", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", plan: "PLUS", planSource: "founder" });
    const res = await POST(req(valid));
    expect(res.status).toBe(409);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("recusa contrato que não é do utilizador", async () => {
    const res = await POST(req({ ...valid, contract: "purchase:alheio" }));
    expect(res.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("recusa email inválido", async () => {
    const res = await POST(req({ ...valid, email: "nope" }));
    expect(res.status).toBe(400);
  });

  it("503 se o email falhar (a página indica o contacto alternativo)", async () => {
    sendEmail.mockRejectedValueOnce(new Error("RESEND_API_KEY em falta"));
    const res = await POST(req(valid));
    expect(res.status).toBe(503);
  });
});
