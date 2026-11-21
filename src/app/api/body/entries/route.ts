import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPlusAccess } from "@/lib/plan";
import { REGIONS } from "@/lib/body-regions";

const schema = z.object({
  region: z.enum(REGIONS.map((r) => r.id) as [string, ...string[]]),
  intensity: z.number().int().min(0).max(10),
  note: z.string().max(2000).optional().nullable(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const hasReport = await prisma.purchase.findFirst({
    where: { userId: user.id, sku: "body_report_30d" },
  });
  if (!hasPlusAccess(user) && !hasReport) {
    return NextResponse.json({ error: "payment_required" }, { status: 402 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const entry = await prisma.bodyEntry.create({
    data: {
      userId: user.id,
      region: parsed.data.region,
      intensity: parsed.data.intensity,
      note: parsed.data.note?.trim() || null,
    },
  });

  return NextResponse.json({ id: entry.id }, { status: 201 });
}
