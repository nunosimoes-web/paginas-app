import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  user: { findUnique: vi.fn() },
  purchase: { findFirst: vi.fn() },
  bodyEntry: { create: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "u1" } })),
}));

const { POST } = await import("./route");

function req(body: unknown) {
  return new Request("http://localhost/api/body/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findUnique.mockResolvedValue({ id: "u1", plan: "PLUS", planSource: "stripe" });
  prismaMock.purchase.findFirst.mockResolvedValue(null);
  prismaMock.bodyEntry.create.mockResolvedValue({ id: "e1" });
});

describe("POST /api/body/entries — consentimento para dados de saúde", () => {
  it("recusa o registo sem consentimento explícito", async () => {
    const res = await POST(req({ region: "chest", intensity: 3, note: "" }));
    expect(res.status).toBe(400);
    expect(prismaMock.bodyEntry.create).not.toHaveBeenCalled();
  });

  it("recusa consentimento que não seja exatamente true", async () => {
    const res = await POST(req({ region: "chest", intensity: 3, consent: "yes" }));
    expect(res.status).toBe(400);
    expect(prismaMock.bodyEntry.create).not.toHaveBeenCalled();
  });

  it("grava com consentimento explícito", async () => {
    const res = await POST(req({ region: "chest", intensity: 3, note: " nota ", consent: true }));
    expect(res.status).toBe(201);
    expect(prismaMock.bodyEntry.create).toHaveBeenCalledWith({
      data: { userId: "u1", region: "chest", intensity: 3, note: "nota" },
    });
  });

  it("continua a exigir Plus ou o relatório comprado", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", plan: "FREE", planSource: null });
    const res = await POST(req({ region: "chest", intensity: 3, consent: true }));
    expect(res.status).toBe(402);
  });
});
