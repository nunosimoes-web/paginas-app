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

  // Peças
  let n = 0;
  for (const p of raw.pieces) {
    await prisma.contentPiece.upsert({
      where: { externalId: p.id },
      update: {},
      create: {
        externalId: p.id,
        day: p.day,
        type: p.type as PieceType,
        principle: p.principle,
        bodyI18n: p.body,
        moodFit: p.mood_fit,
        depth: p.depth,
        themeId: themeIds[p.theme] ?? null,
        needsReview: true,
      },
    });
    n++;
  }
  console.log(`Seed concluído: ${Object.keys(THEMES).length} temas, ${n} peças.`);
}

main().catch((e) => { console.error(e); process.exit(1); })
      .finally(() => prisma.$disconnect());
