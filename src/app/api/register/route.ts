import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
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

  const { email, password, displayName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: displayName ? displayName : null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
