import { getServerSession } from "next-auth/next";
import { redirect } from "@/i18n/navigation";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

/** Utilizador da sessão atual (registo Prisma completo) ou null. */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

/** Exige sessão; caso contrário redireciona para o login (ciente do locale). */
export async function requireUser(locale: string) {
  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });
  return user!;
}

/** Exige sessão E onboarding concluído. */
export async function requireOnboardedUser(locale: string) {
  const user = await requireUser(locale);
  if (!user.onboardedAt) redirect({ href: "/onboarding", locale });
  return user;
}
