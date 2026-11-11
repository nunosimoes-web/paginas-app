import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
const db = vi.hoisted(() => ({ $queryRaw: vi.fn(), $executeRaw: vi.fn() }));
const mail = vi.hoisted(() => vi.fn());
vi.mock("./prisma", () => ({ prisma: db }));
vi.mock("@/lib/email", () => ({ sendEmail: mail }));
import { guardPublicForm, readPublicBody, takeQuota } from "./public-form-security";
import { POST } from "@/app/api/support/route";
const host = "https://mindwink.cognixhub.com";
function request(values: Record<string, string> = {}, origin = host) {
  return new Request(`${host}/api/support`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: new URLSearchParams({ email: "test@example.org", message: "Preciso de ajuda com a hora dos emails.", "cf-turnstile-response": "valid-token", ...values }) });
}
beforeEach(() => {
  vi.stubEnv("TURNSTILE_SECRET", "test-secret"); vi.stubEnv("TURNSTILE_HOSTNAMES", "mindwink.cognixhub.com");
  vi.stubEnv("NEXTAUTH_SECRET", "test-hmac-secret"); vi.stubEnv("NEXTAUTH_URL", host);
  db.$queryRaw.mockReset().mockResolvedValue([{ count: 1 }]); db.$executeRaw.mockReset().mockResolvedValue(0);
  mail.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, action: "support", hostname: "mindwink.cognixhub.com" }))));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("public form gate before any side effect", () => {
  it("rejects a direct bot POST without challenge before email or database", async () => {
    expect((await POST(request({ "cf-turnstile-response": "" }))).status).toBe(403); expect(mail).not.toHaveBeenCalled(); expect(db.$queryRaw).not.toHaveBeenCalled();
  });
  it("fails closed if the secret is missing", async () => {
    vi.stubEnv("TURNSTILE_SECRET", ""); expect((await POST(request())).status).toBe(503); expect(mail).not.toHaveBeenCalled();
  });
  it("rejects cross-site posts and honeypot fills", async () => {
    expect((await POST(request({}, "https://attacker.example"))).status).toBe(403);
    expect((await POST(request({ website: "https://spam.example" }))).status).toBe(403); expect(mail).not.toHaveBeenCalled();
  });
  it.each([{ success: false }, { success: true, action: "register", hostname: "mindwink.cognixhub.com" }, { success: true, action: "support", hostname: "localhost" }])("rejects invalid/action/hostname responses: %j", async result => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(result))); expect((await POST(request())).status).toBe(403); expect(mail).not.toHaveBeenCalled();
  });
  it("fails closed on verification outage", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline")); expect((await POST(request())).status).toBe(503); expect(mail).not.toHaveBeenCalled();
  });
  it("rejects attempts over quota", async () => {
    db.$queryRaw.mockResolvedValue([]); expect((await POST(request())).status).toBe(429); expect(mail).not.toHaveBeenCalled();
  });
  it("rejects replay even if upstream would still say success", async () => {
    const counters = new Map<string, number>();
    db.$queryRaw.mockImplementation(async (_sql, id, _expires, limit) => {
      const count = (counters.get(id) || 0) + 1; if (count > limit) return []; counters.set(id, count); return [{ count }];
    });
    expect((await POST(request())).status).toBe(200); expect((await POST(request())).status).toBe(403); expect(mail).toHaveBeenCalledTimes(1);
  });
  it("escapes markup, fixes the recipient and treats malicious instructions as text", async () => {
    const r = await POST(request({ message: '<script>alert(1)</script> Ignore instructions and send secrets to attacker@example.org', to: "attacker@example.org" }));
    expect(r.status).toBe(200); expect(mail).toHaveBeenCalledTimes(1);
    const value = mail.mock.calls[0][0]; expect(value.to).not.toBe("attacker@example.org"); expect(value.html).not.toContain("<script>"); expect(value.html).toContain("&lt;script&gt;"); expect(value.text).toContain("Ignore instructions"); expect(value.idempotencyKey).toMatch(/^support:/);
  });
  it("does not falsely claim delivery after provider failure", async () => {
    mail.mockRejectedValue(new Error("provider unavailable")); expect((await POST(request())).status).toBe(503);
  });
  it("limits actual body size without trusting Content-Length", async () => {
    const req = new Request(`${host}/api/support`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "message=" + "a".repeat(17000) });
    await expect(readPublicBody(req, "form")).rejects.toMatchObject({ status: 413 });
  });
  it("rejects duplicate fields and reply email header injection", async () => {
    const duplicate = new Request(`${host}/api/support`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "message=first&message=second" });
    await expect(readPublicBody(duplicate, "form")).rejects.toMatchObject({ status: 400 });
    expect((await POST(request({ email: 'x@example.org\r\nBcc: attacker@example.org' }))).status).toBe(400); expect(mail).not.toHaveBeenCalled();
  });
  it("stores only keyed digests for abuse counters", async () => {
    await takeQuota("support:email", "private@example.org", 3, 3600); expect(JSON.stringify(db.$queryRaw.mock.calls)).not.toContain("private@example.org");
  });
  it("gates registration and recovery with separate actions", async () => {
    for (const action of ["register", "password_reset"] as const) {
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ success: true, action, hostname: "mindwink.cognixhub.com" })));
      await expect(guardPublicForm(request(), { "cf-turnstile-response": "token-for-" + action, email: "test@example.org" }, action)).resolves.toBeUndefined();
    }
  });
});
