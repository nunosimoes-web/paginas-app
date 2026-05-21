"use server";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validation";

export type OnboardingResult = { ok: true } | { error: string };

export async function completeOnboarding(
  input: unknown,
): Promise<OnboardingResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthorized" };

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };

  const { themeSlugs, role, promptHour } = parsed.data;

  const themes = await prisma.theme.findMany({
    where: { slug: { in: themeSlugs } },
  });
  if (themes.length === 0) return { error: "invalid" };

  await prisma.$transaction([
    prisma.userTheme.deleteMany({ where: { userId: user.id } }),
    ...themes.map((th) =>
      prisma.userTheme.create({
        data: { userId: user.id, themeId: th.id, weight: 2 },
      }),
    ),
    prisma.user.update({
      where: { id: user.id },
      data: { role, promptHour, onboardedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
