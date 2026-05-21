// =============================================================================
//  src/lib/report.ts — Relatório diário de utilização da Páginas.
// -----------------------------------------------------------------------------
//  Reúne números de utilização (utilizadores, onboarding, check-ins, diário,
//  entregas) e produz o HTML/texto de um email de relatório interno.
// =============================================================================

import { prisma } from "./prisma";

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function buildUsageReport(): Promise<{
  subject: string;
  html: string;
  text: string;
}> {
  const now = new Date();
  const d1 = new Date(now.getTime() - 24 * 3600 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [
    users,
    onboarded,
    new24,
    new7,
    checkins,
    checkins24,
    journals,
    journals24,
    deliveries,
    opened,
    emailed24,
    links,
    checkin7,
    journal7,
    perUser,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboardedAt: { not: null } } }),
    prisma.user.count({ where: { createdAt: { gte: d1 } } }),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.moodCheckIn.count(),
    prisma.moodCheckIn.count({ where: { createdAt: { gte: d1 } } }),
    prisma.journalEntry.count(),
    prisma.journalEntry.count({ where: { createdAt: { gte: d1 } } }),
    prisma.promptDelivery.count(),
    prisma.promptDelivery.count({ where: { opened: true } }),
    prisma.promptDelivery.count({ where: { emailSentAt: { gte: d1 } } }),
    prisma.clientLink.count({ where: { status: "active" } }),
    prisma.moodCheckIn.findMany({
      where: { createdAt: { gte: d7 } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.journalEntry.findMany({
      where: { createdAt: { gte: d7 } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        onboardedAt: true,
        _count: {
          select: { checkIns: true, journalEntries: true, deliveries: true },
        },
      },
    }),
  ]);

  const active7 = new Set<string>([
    ...checkin7.map((c) => c.userId),
    ...journal7.map((j) => j.userId),
  ]).size;

  const today = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);

  const subject = `Páginas — relatório diário (${today}): ${users} utilizadores, ${active7} ativos`;

  // --- Métricas principais ---
  const stats: [string, string | number][] = [
    ["Utilizadores registados", users],
    ["Com onboarding concluído", onboarded],
    ["Novos (24h / 7 dias)", `${new24} / ${new7}`],
    ["Ativos nos últimos 7 dias", active7],
    ["Check-ins (total / 24h)", `${checkins} / ${checkins24}`],
    ["Entradas de diário (total / 24h)", `${journals} / ${journals24}`],
    ["Peças entregues (total / abertas)", `${deliveries} / ${opened}`],
    ["Emails enviados (24h)", emailed24],
    ["Ligações terapeuta–cliente ativas", links],
  ];

  const statRows = stats
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 0;border-bottom:1px solid #ece6d8;color:#6d675d;font-size:14px;">${esc(k)}</td><td style="padding:7px 0;border-bottom:1px solid #ece6d8;color:#2f2b26;font-size:14px;font-weight:600;text-align:right;">${esc(String(v))}</td></tr>`,
    )
    .join("");

  // --- Tabela por utilizador ---
  const userRows = perUser
    .map((u) => {
      const name = u.displayName || u.email;
      const role = u.role === "THERAPIST" ? " (terapeuta)" : "";
      const ob = u.onboardedAt ? "✓" : "—";
      return `<tr>
<td style="padding:6px 8px;border-bottom:1px solid #ece6d8;font-size:13px;color:#2f2b26;">${esc(name)}${role}</td>
<td style="padding:6px 8px;border-bottom:1px solid #ece6d8;font-size:13px;color:#6d675d;text-align:center;">${fmtDate(u.createdAt)}</td>
<td style="padding:6px 8px;border-bottom:1px solid #ece6d8;font-size:13px;color:#6d675d;text-align:center;">${ob}</td>
<td style="padding:6px 8px;border-bottom:1px solid #ece6d8;font-size:13px;color:#6d675d;text-align:center;">${u._count.checkIns}</td>
<td style="padding:6px 8px;border-bottom:1px solid #ece6d8;font-size:13px;color:#6d675d;text-align:center;">${u._count.journalEntries}</td>
<td style="padding:6px 8px;border-bottom:1px solid #ece6d8;font-size:13px;color:#6d675d;text-align:center;">${u._count.deliveries}</td>
</tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3efe6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe6;">
<tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fffdf8;border:1px solid #e6e0d2;border-radius:14px;">
<tr><td style="padding:30px 34px 0 34px;font-family:Georgia,serif;font-size:17px;color:#9a937f;">Páginas — relatório diário</td></tr>
<tr><td style="padding:4px 34px 0 34px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#9a937f;">${esc(today)}</td></tr>
<tr><td style="padding:20px 34px 0 34px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${statRows}</table>
</td></tr>
<tr><td style="padding:26px 34px 8px 34px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#a79f88;">Por utilizador</td></tr>
<tr><td style="padding:0 34px 0 34px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<th style="padding:6px 8px;border-bottom:2px solid #e6e0d2;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a79f88;text-align:left;">Utilizador</th>
<th style="padding:6px 8px;border-bottom:2px solid #e6e0d2;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a79f88;">Registo</th>
<th style="padding:6px 8px;border-bottom:2px solid #e6e0d2;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a79f88;">Onb.</th>
<th style="padding:6px 8px;border-bottom:2px solid #e6e0d2;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a79f88;">Check-ins</th>
<th style="padding:6px 8px;border-bottom:2px solid #e6e0d2;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a79f88;">Diário</th>
<th style="padding:6px 8px;border-bottom:2px solid #e6e0d2;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a79f88;">Peças</th>
</tr>
${userRows}
</table>
</td></tr>
<tr><td style="padding:24px 34px 30px 34px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:#bdb6a2;">Relatório automático da Páginas. Gerado todos os dias.</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const textStats = stats.map(([k, v]) => `  ${k}: ${v}`).join("\n");
  const textUsers = perUser
    .map(
      (u) =>
        `  ${u.displayName || u.email}${u.role === "THERAPIST" ? " (terapeuta)" : ""} — registo ${fmtDate(u.createdAt)}, onboarding ${u.onboardedAt ? "sim" : "nao"}, check-ins ${u._count.checkIns}, diario ${u._count.journalEntries}, pecas ${u._count.deliveries}`,
    )
    .join("\n");
  const text = `Páginas — relatório diário (${today})\n\n${textStats}\n\nPor utilizador:\n${textUsers}\n`;

  return { subject, html, text };
}
