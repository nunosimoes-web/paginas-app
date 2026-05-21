// =============================================================================
//  src/lib/engine.ts — Motor de personalização "Páginas"
// -----------------------------------------------------------------------------
//  Núcleo (pickPiece) puro e determinístico, desacoplado de Prisma e testável.
//  Wrapper (selectDailyPiece) que vai à base de dados, regista a entrega e
//  garante idempotência por (utilizador, dia).
//
//  Princípios de desenho:
//   - DETERMINISTA por (userId, date): a mesma pessoa vê a mesma peça no mesmo dia.
//   - RESILIENTE: nunca devolve vazio. Se os filtros estreitarem demais, relaxa-os
//     por camadas até haver candidato.
//   - GENTIL: em dias de humor baixo, evita conteúdo "profundo" (depth alto).
//   - SEMENTE DO TERAPEUTA: temas semeados na última semana têm prioridade forte.
// =============================================================================

export type PieceType = "METAPHOR" | "REMINDER" | "EXERCISE" | "REFLECTION";

export interface Piece {
  id: string;
  day: number;
  type: PieceType;
  principle: string;
  themeSlug: string | null;
  moodFit: string[];   // ex.: ["anxious","any"]
  depth: number;       // 1 (leve) .. 3 (profundo)
}

export interface UserTheme {
  slug: string;
  weight: number;      // intensidade do interesse (>=1)
}

export interface SelectionContext {
  userId: string;
  /** Data alvo no formato ISO "YYYY-MM-DD" (apenas o dia importa). */
  dateISO: string;
  candidates: Piece[];
  userThemes: UserTheme[];
  /** Último humor reportado: 1 (muito baixo) .. 5 (muito bom), ou null. */
  recentMood: number | null;
  /** Temas semeados pelo terapeuta e ainda dentro da janela de prioridade. */
  seededThemes?: string[];
  /** Ids de peças entregues recentemente, a evitar repetir. */
  recentlyDeliveredIds?: string[];
}

export interface SelectionResult {
  piece: Piece;
  score: number;
  /** Quais relaxamentos foram precisos (vazio = caminho ideal). Útil para logging. */
  relaxations: string[];
}

// --- Pesos do scoring (afináveis) -------------------------------------------
const W = {
  SEEDED_THEME: 100,   // prioridade do terapeuta domina
  THEME_MATCH: 12,     // multiplicado pelo weight do tema do utilizador
  MOOD_FIT: 8,
  TYPE_METAPHOR: 6,    // viés para o formato-âncora
  TYPE_EXERCISE_LOWMOOD: 5, // em dias maus, um exercício concreto ajuda
  DEPTH_PENALTY_LOWMOOD: 9, // penaliza profundidade quando o humor está em baixo
};

// --- Hash determinístico (FNV-1a) para desempate estável por dia/pessoa ------
export function stableHash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned
}

/** Converte humor 1-5 num "estado" e nos tokens de moodFit aceitáveis. */
export function moodToTokens(mood: number | null): { state: "low" | "neutral" | "good" | "unknown"; tokens: Set<string> } {
  if (mood == null) return { state: "unknown", tokens: new Set(["any", "neutral"]) };
  if (mood <= 2) return { state: "low", tokens: new Set(["low", "sad", "anxious", "angry", "tender", "any"]) };
  if (mood === 3) return { state: "neutral", tokens: new Set(["neutral", "any"]) };
  return { state: "good", tokens: new Set(["neutral", "any"]) };
}

function scorePiece(p: Piece, ctx: SelectionContext, themeWeight: Map<string, number>, mood: ReturnType<typeof moodToTokens>): number {
  let s = 0;

  // Prioridade do terapeuta
  if (p.themeSlug && ctx.seededThemes?.includes(p.themeSlug)) s += W.SEEDED_THEME;

  // Correspondência de tema do utilizador (ponderada)
  if (p.themeSlug && themeWeight.has(p.themeSlug)) s += W.THEME_MATCH * (themeWeight.get(p.themeSlug) || 1);

  // Adequação ao humor
  const moodOk = p.moodFit.some((m) => mood.tokens.has(m));
  if (moodOk) s += W.MOOD_FIT;

  // Viés de tipo
  if (p.type === "METAPHOR") s += W.TYPE_METAPHOR;
  if (mood.state === "low" && p.type === "EXERCISE") s += W.TYPE_EXERCISE_LOWMOOD;

  // Em humor baixo, evitar profundidade
  if (mood.state === "low") s -= W.DEPTH_PENALTY_LOWMOOD * (p.depth - 1);

  return s;
}

/**
 * Núcleo puro: escolhe a peça do dia de forma determinística e resiliente.
 * Aplica filtros em camadas; se nada sobrar, relaxa-os por ordem até haver candidato.
 */
export function pickPiece(ctx: SelectionContext): SelectionResult {
  if (!ctx.candidates || ctx.candidates.length === 0) {
    throw new Error("pickPiece: não há candidatos na biblioteca de conteúdo.");
  }

  const themeWeight = new Map<string, number>();
  for (const t of ctx.userThemes) themeWeight.set(t.slug, t.weight);
  const mood = moodToTokens(ctx.recentMood);
  const recent = new Set(ctx.recentlyDeliveredIds || []);

  // Camadas de filtro, da mais restritiva à mais permissiva.
  const layers: Array<{ name: string; filter: (p: Piece) => boolean }> = [
    { name: "ideal", filter: (p) => !recent.has(p.id) && p.moodFit.some((m) => mood.tokens.has(m)) },
    { name: "drop_mood", filter: (p) => !recent.has(p.id) },
    { name: "drop_recent", filter: (_p) => true },
  ];

  // relaxations = relaxamento EFETIVAMENTE aplicado (a camada que resolveu),
  // excluindo o caminho "ideal" (sem relaxamento).
  const relaxations: string[] = [];
  let pool: Piece[] = [];
  for (const layer of layers) {
    pool = ctx.candidates.filter(layer.filter);
    if (pool.length > 0) {
      if (layer.name !== "ideal") relaxations.push(layer.name);
      break;
    }
  }
  if (pool.length === 0) { pool = ctx.candidates.slice(); relaxations.push("fallback_all"); } // salvaguarda final

  // Pontuar e escolher o máximo; desempate determinístico por hash(userId|date|id).
  let best: Piece | null = null;
  let bestScore = -Infinity;
  let bestTie = -Infinity;
  for (const p of pool) {
    const score = scorePiece(p, ctx, themeWeight, mood);
    const tie = stableHash(`${ctx.userId}|${ctx.dateISO}|${p.id}`);
    if (score > bestScore || (score === bestScore && tie > bestTie)) {
      best = p;
      bestScore = score;
      bestTie = tie;
    }
  }

  return { piece: best as Piece, score: bestScore, relaxations };
}

// =============================================================================
//  Wrapper Prisma (lado servidor). Idempotente por (userId, dia).
//  Nota: importa o teu cliente Prisma; ajusta o caminho de import se necessário.
// =============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DailyPieceForUser {
  externalId: string;
  day: number;
  type: PieceType;
  principle: string;
  bodyI18n: Record<string, string>;
  themeSlug: string | null;
  relaxations: string[];
}

const SEED_WINDOW_DAYS = 7;

export async function selectDailyPiece(prisma: any, userId: string, date = new Date()): Promise<DailyPieceForUser> {
  const dateISO = date.toISOString().slice(0, 10);
  const dayStart = new Date(dateISO + "T00:00:00.000Z");
  const dayEnd = new Date(dateISO + "T23:59:59.999Z");

  // Idempotência: já existe entrega para hoje?
  const existing = await prisma.promptDelivery.findFirst({
    where: { userId, date: { gte: dayStart, lte: dayEnd } },
    include: { piece: { include: { theme: true } } },
  });
  if (existing) return mapDelivery(existing.piece, []);

  // Recolher contexto.
  const [user, userThemes, lastMood, recentDeliveries, links, allPieces] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userTheme.findMany({ where: { userId }, include: { theme: true } }),
    prisma.moodCheckIn.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.promptDelivery.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60, select: { pieceId: true } }),
    prisma.clientLink.findMany({ where: { clientId: userId, status: "active" } }),
    prisma.contentPiece.findMany({ include: { theme: true } }),
  ]);
  if (!user) throw new Error("selectDailyPiece: utilizador não encontrado.");

  // Temas semeados ainda dentro da janela (assume seededThemes = { slug: ISOdate }).
  const seededThemes: string[] = [];
  for (const link of links) {
    const seeded = (link.seededThemes || {}) as Record<string, string>;
    for (const [slug, whenISO] of Object.entries(seeded)) {
      const when = new Date(whenISO);
      if (!isNaN(when.getTime()) && (date.getTime() - when.getTime()) / 86400000 <= SEED_WINDOW_DAYS) {
        seededThemes.push(slug);
      }
    }
  }

  const candidates: Piece[] = allPieces.map((cp: any) => ({
    id: cp.externalId,
    day: cp.day,
    type: cp.type,
    principle: cp.principle,
    themeSlug: cp.theme?.slug ?? null,
    moodFit: cp.moodFit,
    depth: cp.depth,
  }));

  const result = pickPiece({
    userId,
    dateISO,
    candidates,
    userThemes: userThemes.map((ut: any) => ({ slug: ut.theme.slug, weight: ut.weight })),
    recentMood: lastMood?.mood ?? null,
    seededThemes,
    recentlyDeliveredIds: recentDeliveries
      .map((d: any) => d.pieceId)
      .filter(Boolean) as string[],
  });

  // Mapear externalId -> registo e registar a entrega.
  const chosen = await prisma.contentPiece.findUnique({
    where: { externalId: result.piece.id },
    include: { theme: true },
  });
  await prisma.promptDelivery.create({
    data: { userId, pieceId: chosen.id, date: dayStart, opened: false },
  });
  return mapDelivery(chosen, result.relaxations);
}

function mapDelivery(cp: any, relaxations: string[]): DailyPieceForUser {
  return {
    externalId: cp.externalId,
    day: cp.day,
    type: cp.type,
    principle: cp.principle,
    bodyI18n: cp.bodyI18n,
    themeSlug: cp.theme?.slug ?? null,
    relaxations,
  };
}
