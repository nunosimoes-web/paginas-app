import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { guardPublicForm, readPublicBody, PublicFormError } from "@/lib/public-form-security";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await readPublicBody(request, "json");
  } catch (error) {
    return NextResponse.json({ error: "bad_request" }, { status: error instanceof PublicFormError ? error.status : 400 });
  }

  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    const weakPassword = parsed.error.issues.some(
      (i) => i.path[0] === "password",
    );
    return NextResponse.json(
      { error: weakPassword ? "weak_password" : "bad_request" },
      { status: 400 },
    );
  }

  try { await guardPublicForm(request, json as Record<string, unknown>, "register"); }
  catch (error) { return NextResponse.json({ error: error instanceof PublicFormError ? error.code : "temporarily_unavailable" }, { status: error instanceof PublicFormError ? error.status : 503 }); }

  const { email, password, displayName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: displayName ? displayName : null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
