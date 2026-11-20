import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks dos módulos antes do import da route.

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  purchase: {
    upsert: vi.fn(),
  },
};

const stripeMock = {
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/stripe", () => ({
  stripeConfigured: () => true,
  getStripe: () => stripeMock,
}));

const { POST } = await import("./route");

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

describe("POST /api/stripe/webhook", () => {
  it("devolve 400 sem assinatura", async () => {
    const res = await POST(makeRequest({ type: "x" }));
    expect(res.status).toBe(400);
  });

  it("devolve 400 com assinatura inválida", async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("bad");
    });
    const res = await POST(
      makeRequest({ type: "x" }, { "stripe-signature": "bad" }),
    );
    expect(res.status).toBe(400);
  });

  it("checkout.session.completed cria Purchase para body_report (idempotente)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      stripeCustomerId: "cus_123",
      planSource: null,
      plan: "FREE",
    });
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_123",
          mode: "payment",
          metadata: { userId: "u1", plan: "body_report" },
          client_reference_id: "u1",
          customer: "cus_123",
          payment_intent: "pi_1",
          amount_total: 900,
          currency: "eur",
        },
      },
    });

    const res = await POST(
      makeRequest("payload", { "stripe-signature": "ok" }),
    );
    expect(res.status).toBe(200);
    expect(prismaMock.purchase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSessionId: "cs_123" },
      }),
    );
  });

  it("founder nunca é alterado por customer.subscription.updated", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      stripeCustomerId: "cus_123",
      planSource: "founder",
      plan: "FREE",
    });
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          status: "active",
          metadata: { plan: "plus_month" },
          current_period_end: 1234567890,
        },
      },
    });

    const res = await POST(
      makeRequest("payload", { "stripe-signature": "ok" }),
    );
    expect(res.status).toBe(200);
    // Nada alterado: a regra fixa diz founder não é mexido.
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("customer.subscription.updated activa plano PLUS para stripe", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      stripeCustomerId: "cus_123",
      planSource: null,
      plan: "FREE",
    });
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          status: "active",
          metadata: { plan: "plus_year" },
          current_period_end: 1234567890,
        },
      },
    });

    const res = await POST(
      makeRequest("payload", { "stripe-signature": "ok" }),
    );
    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plan: "PLUS",
          planSource: "stripe",
        }),
      }),
    );
  });

  it("customer.subscription.deleted volta a FREE excepto founder", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      stripeCustomerId: "cus_123",
      planSource: "stripe",
      plan: "PLUS",
    });
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_123", status: "canceled" } },
    });

    const res = await POST(
      makeRequest("payload", { "stripe-signature": "ok" }),
    );
    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { plan: "FREE", planRenewsAt: null } }),
    );
  });
});
