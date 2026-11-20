import { PrismaClient, PieceType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { join } from "path";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const THEMES: Record<string, { "pt-PT": string; en: string }> = {
  anxiety:        { "pt-PT": "Ansiedade", en: "Anxiety" },
  self_criticism: { "pt-PT": "Autocrítica", en: "Self-criticism" },
  grief:          { "pt-PT": "Luto", en: "Grief" },
  relationships:  { "pt-PT": "Relações", en: "Relationships" },
  transitions:    { "pt-PT": "Transições", en: "Transitions" },
  loneliness:     { "pt-PT": "Solidão", en: "Loneliness" },
  anger:          { "pt-PT": "Raiva", en: "Anger" },
  trauma:         { "pt-PT": "Trauma", en: "Trauma" },
  boundaries:     { "pt-PT": "Fronteiras", en: "Boundaries" },
};

// Percursos de 21 dias (Plus). A ordem dos pieceOrder é a sequência diária.
const PROGRAMS: Array<{
  slug: string;
  titleI18n: Record<string, string>;
  summaryI18n: Record<string, string>;
  days: number;
  themeFilter: string;
}> = [
  {
    slug: "anxiety-21",
    titleI18n: {
      "pt-PT": "Ansiedade — 21 dias",
      en: "Anxiety — 21 days",
    },
    summaryI18n: {
      "pt-PT":
        "Vinte e um dias com peças calmas para habitar a ansiedade — sem forçar nada — e devolver um pouco de chão aos dias.",
      en:
        "Twenty-one days of calm pieces for living with anxiety — without forcing anything — and gently giving back some ground to your days.",
    },
    days: 21,
    themeFilter: "anxiety",
  },
];

async function main() {
  const raw = JSON.parse(readFileSync(join(process.cwd(), "data/content_365.json"), "utf-8"));

  // Temas
  const themeIds: Record<string, string> = {};
  for (const [slug, nameI18n] of Object.entries(THEMES)) {
    const t = await prisma.theme.upsert({
      where: { slug }, update: { nameI18n },
      create: { slug, nameI18n },
    });
    themeIds[slug] = t.id;
  }

  // Peças. As 365 peças foram revistas pelo Nuno a 20/11/2026 — seed marca
  // needsReview=false mesmo em upsert (update), mantendo o conteúdo tal como está.
  let n = 0;
  for (const p of raw.pieces) {
    await prisma.contentPiece.upsert({
      where: { externalId: p.id },
      update: { needsReview: false },
      create: {
        externalId: p.id,
        day: p.day,
        type: p.type as PieceType,
        principle: p.principle,
        bodyI18n: p.body,
        moodFit: p.mood_fit,
        depth: p.depth,
        themeId: themeIds[p.theme] ?? null,
        needsReview: false,
      },
    });
    n++;
  }

  // Percursos: usamos as N primeiras peças do tema, por dia ascendente.
  let programs = 0;
  for (const prog of PROGRAMS) {
    const themed = raw.pieces
      .filter((p: { theme: string }) => p.theme === prog.themeFilter)
      .sort((a: { day: number }, b: { day: number }) => a.day - b.day)
      .slice(0, prog.days)
      .map((p: { id: string }) => p.id);

    if (themed.length < prog.days) {
      console.warn(
        `Programa ${prog.slug}: só ${themed.length} peças disponíveis (precisa ${prog.days}).`,
      );
    }

    await prisma.program.upsert({
      where: { slug: prog.slug },
      update: {
        titleI18n: prog.titleI18n,
        summaryI18n: prog.summaryI18n,
        days: prog.days,
        pieceOrder: themed,
      },
      create: {
        slug: prog.slug,
        titleI18n: prog.titleI18n,
        summaryI18n: prog.summaryI18n,
        days: prog.days,
        pieceOrder: themed,
      },
    });
    programs++;
  }

  console.log(
    `Seed concluído: ${Object.keys(THEMES).length} temas, ${n} peças, ${programs} percursos.`,
  );
}

main().catch((e) => { console.error(e); process.exit(1); })
      .finally(() => prisma.$disconnect());
