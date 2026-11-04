import express, { type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { config } from "./config.js";
import { ensureDirs, mediaDir, generatedDir } from "./cache.js";
import { sanitizeKidText, sanitizeName } from "./safety.js";
import * as falApi from "./fal.js";
import { left, consume } from "./quota.js";
import { generateAll, progress as genProgress } from "./generate.js";
import type { AiStatus, ApiError } from "../shared/types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// Em produção: dist-server/server/index.js -> dist/ fica dois níveis acima.
const distDir = [path.resolve(here, "../../dist"), path.resolve(here, "../dist")].find((p) => fs.existsSync(p));

await ensureDirs();
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(express.json({ limit: "10kb" }));

// Cabeçalhos de segurança básicos (app pública para crianças: sem tracking, sem cookies).
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});

// Limite simples por IP para as rotas de IA.
const hits = new Map<string, number[]>();
function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip ?? "anon";
    const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      res.status(429).json(err("rate_limited", "Calma, dançarino! Espera um bocadinho e tenta outra vez."));
      return;
    }
    arr.push(now);
    hits.set(key, arr);
    next();
  };
}

const err = (error: string, friendly: string): ApiError => ({ error, friendly });

app.get("/health", (_req, res) => res.json({ ok: true, ai: config.aiEnabled }));

app.get("/api/ai/status", (_req, res) => {
  const status: AiStatus = {
    enabled: config.aiEnabled,
    features: {
      image: config.aiEnabled,
      video: config.aiEnabled,
      tts: config.aiEnabled,
      music: config.aiEnabled,
    },
    quotas: { imagesLeft: left("images"), videosLeft: left("videos"), songsLeft: left("songs") },
  };
  res.json(status);
});

function requireAi(_req: Request, res: Response, next: NextFunction) {
  if (!config.aiEnabled) {
    res.status(503).json(err("ai_disabled", "O Estúdio Mágico está a dormir. Pede a um adulto para ligar a chave fal.ai."));
    return;
  }
  next();
}

const wrap = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response) =>
  fn(req, res).catch((e: unknown) => {
    console.error(e);
    res.status(500).json(err("fal_error", "Ups, a magia falhou. Tenta outra vez daqui a bocadinho."));
  });

app.post(
  "/api/ai/tts",
  requireAi,
  rateLimit(60, 60_000),
  wrap(async (req, res) => {
    const body = z.object({ text: z.string().min(1).max(300) }).safeParse(req.body);
    if (!body.success) {
      res.status(400).json(err("bad_request", "Texto inválido."));
      return;
    }
    res.json(await falApi.tts(body.data.text.trim()));
  }),
);

app.post(
  "/api/ai/dancer",
  requireAi,
  rateLimit(10, 60_000),
  wrap(async (req, res) => {
    const s = sanitizeKidText((req.body as { description?: unknown })?.description);
    if (!s.ok) {
      res.status(400).json(err("unsafe", s.reason!));
      return;
    }
    if (!consume("images")) {
      res.status(429).json(err("quota", "Os pincéis mágicos estão cansados por hoje. Volta amanhã!"));
      return;
    }
    res.json(await falApi.dancerImage(s.cleaned));
  }),
);

app.post(
  "/api/ai/animate",
  requireAi,
  rateLimit(4, 60_000),
  wrap(async (req, res) => {
    const body = z.object({ imageId: z.string().regex(/^img-[a-f0-9]{20}$/) }).safeParse(req.body);
    if (!body.success) {
      res.status(400).json(err("bad_request", "Imagem inválida."));
      return;
    }
    if (!consume("videos")) {
      res.status(429).json(err("quota", "A câmara mágica já fez muitos vídeos hoje. Volta amanhã!"));
      return;
    }
    const base = `${req.protocol}://${req.get("host")}`;
    res.json(await falApi.animate(body.data.imageId, base));
  }),
);

app.post(
  "/api/ai/song",
  requireAi,
  rateLimit(6, 60_000),
  wrap(async (req, res) => {
    const body = z
      .object({
        name: z.string().max(30),
        style: z.enum(["robo", "hiphop", "ballet", "festa", "disco"]),
        instrumental: z.boolean().optional(),
      })
      .safeParse(req.body);
    if (!body.success) {
      res.status(400).json(err("bad_request", "Pedido inválido."));
      return;
    }
    if (!consume("songs")) {
      res.status(429).json(err("quota", "A banda já tocou muito hoje. Volta amanhã!"));
      return;
    }
    res.json(await falApi.song(sanitizeName(body.data.name), body.data.style, body.data.instrumental ?? false));
  }),
);

// Administração: pré-gerar mascotes/músicas/vozes. Protegido por ADMIN_KEY.
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = (req.query.key as string) || req.get("x-admin-key") || "";
  if (!config.adminKey || key !== config.adminKey) {
    res.status(401).json(err("unauthorized", "Sem autorização."));
    return;
  }
  next();
}
app.post("/api/admin/generate", requireAdmin, requireAi, (req, res) => {
  if (genProgress.running) {
    res.status(409).json({ ...genProgress });
    return;
  }
  const q = req.query;
  const base = `${req.protocol}://${req.get("host")}`;
  generateAll(
    { images: q.images !== "0", music: q.music !== "0", voice: q.voice !== "0", videos: q.videos === "1" },
    base,
  ).catch((e) => console.error("generate:", e));
  res.status(202).json({ started: true });
});
app.get("/api/admin/generate/status", requireAdmin, (_req, res) => res.json({ ...genProgress }));

// Ficheiros gerados (cache persistente) e manifesto.
app.use("/media", express.static(mediaDir(), { maxAge: "365d", immutable: true }));
app.use("/generated", express.static(generatedDir(), { maxAge: "0" }));

// App (Vite build) + fallback SPA.
if (distDir) {
  app.use(express.static(distDir, { maxAge: "1h", index: "index.html" }));
  app.get("/{*splat}", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
} else {
  app.get("/", (_req, res) => res.send("Bailarico API. Corre `npm run build` para servir a app."));
}

app.listen(config.port, () => {
  console.log(`Bailarico a dançar em http://localhost:${config.port} — fal.ai ${config.aiEnabled ? "LIGADO" : "desligado (modo offline)"}`);
});
