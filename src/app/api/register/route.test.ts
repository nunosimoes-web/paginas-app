import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: async () => null, create } },
}));
vi.mock("@/lib/password", () => ({ hashPassword: async () => "hash" }));
vi.mock("@/lib/public-form-security", () => ({
  guardPublicForm: async () => {},
  readPublicBody: (r: Request) => r.json(),
  PublicFormError: class extends Error {},
}));

const { POST } = await import("./route");
const post = (body: object) =>
  POST(
    new Request("http://localhost/api/register", {
      method: "POST",
      body: JSON.stringify({
        email: "a@example.com",
        password: "umaboapass",
        ...body,
      }),
    }),
  );

describe("registo", () => {
  beforeEach(() => create.mockReset());

  it("guarda o idioma e não liga o email diário sem escolha", async () => {
    expect((await post({ locale: "en" })).status).toBe(201);
    expect(create.mock.calls[0][0].data).toMatchObject({
      locale: "en",
      emailDaily: false,
    });
  });

  it("sem idioma usa o valor por omissão da base de dados", async () => {
    expect((await post({})).status).toBe(201);
    expect(create.mock.calls[0][0].data).not.toHaveProperty("locale");
  });

  it("recusa idiomas desconhecidos", async () => {
    expect((await post({ locale: "xx" })).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
