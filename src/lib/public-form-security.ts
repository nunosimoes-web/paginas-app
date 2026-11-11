import { createHmac } from "node:crypto";
import { prisma } from "./prisma";

export type PublicAction = "support" | "register" | "password_reset";
export class PublicFormError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
export function privateDigest(scope: string, value: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new PublicFormError(503, "temporarily_unavailable");
  return createHmac("sha256", secret).update(`${scope}\0${value}`).digest("hex");
}
export async function readPublicBody(request: Request, mode: "form" | "json") {
  const type = request.headers.get("content-type") || "";
  if (mode === "json" ? !type.startsWith("application/json") : !/^(multipart\/form-data|application\/x-www-form-urlencoded)/i.test(type)) {
    throw new PublicFormError(415, "bad_request");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new PublicFormError(400, "bad_request");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 16 * 1024) { await reader.cancel(); throw new PublicFormError(413, "bad_request"); }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  try {
    if (mode === "json") {
      const data: unknown = JSON.parse(bytes.toString("utf8"));
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
      return data as Record<string, unknown>;
    }
    const form = await new Request(request.url, { method: "POST", headers: { "content-type": type }, body: bytes }).formData();
    const data: Record<string, unknown> = {};
    for (const [key, value] of form) {
      if (typeof value !== "string" || key in data) throw new Error();
      data[key] = value;
    }
    return data;
  } catch { throw new PublicFormError(400, "bad_request"); }
}
// One atomic database operation works across processes/redeploys. No raw IP/email/token is stored.
export async function takeQuota(scope: string, value: string, limit: number, seconds: number, singleUse = false) {
  const time = Date.now();
  const window = singleUse ? "once" : String(Math.floor(time / (seconds * 1000)));
  const id = `${scope}:${privateDigest(scope, value)}:${window}`;
  const expires = new Date(time + seconds * 1000);
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "PublicFormQuota" ("id", "count", "expiresAt") VALUES (${id}, 1, ${expires})
    ON CONFLICT ("id") DO UPDATE SET "count" = "PublicFormQuota"."count" + 1
    WHERE "PublicFormQuota"."count" < ${limit}
    RETURNING "count"`;
  // Rows are temporary abuse counters; cleanup also happens on rejected replays.
  await prisma.$executeRaw`DELETE FROM "PublicFormQuota" WHERE "expiresAt" < ${new Date(time)}`;
  return rows.length > 0;
}
export async function guardPublicForm(request: Request, data: Record<string, unknown>, action: PublicAction) {
  const secret = process.env.TURNSTILE_SECRET;
  const hosts = new Set((process.env.TURNSTILE_HOSTNAMES || "").split(",").map(h => h.trim()).filter(Boolean));
  if (!secret || hosts.size === 0) throw new PublicFormError(503, "temporarily_unavailable");
  let origin: URL;
  try { origin = new URL(request.headers.get("origin") || ""); } catch { throw new PublicFormError(403, "verification_required"); }
  if (!hosts.has(origin.hostname) || ((origin.protocol !== "https:" || (origin.port && origin.port !== "443")) && process.env.NODE_ENV === "production")) throw new PublicFormError(403, "verification_required");
  if (data.website) throw new PublicFormError(403, "verification_required");
  const token = data["cf-turnstile-response"];
  if (typeof token !== "string" || !token || token.length > 2048) throw new PublicFormError(403, "verification_required");
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    if (!(await takeQuota(`${action}:attempt`, ip, 20, 900))) throw new PublicFormError(429, "rate_limited");
    // App-level single use closes the brief consistency window in upstream replay detection.
    if (!(await takeQuota("turnstile-token", token, 1, 600, true))) throw new PublicFormError(403, "verification_required");
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000), body: new URLSearchParams({ secret, response: token }),
    });
    if (!response.ok) throw new Error("siteverify unavailable");
    const result = await response.json();
    if (result.success !== true || result.action !== action || !hosts.has(result.hostname)) throw new PublicFormError(403, "verification_required");
    if (!(await takeQuota(`${action}:accepted`, ip, 5, 900)) || !(await takeQuota(`${action}:global`, "all", 80, 3600))) throw new PublicFormError(429, "rate_limited");
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (email && !(await takeQuota(`${action}:email`, email, 3, 3600))) throw new PublicFormError(429, "rate_limited");
  } catch (error) {
    if (error instanceof PublicFormError) throw error;
    throw new PublicFormError(503, "temporarily_unavailable");
  }
}
