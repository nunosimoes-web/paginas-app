import { ensureDirs } from "../server/cache.js";
import { config } from "../server/config.js";
import { generateAll } from "../server/generate.js";
import { isLocale } from "../shared/i18n/index.js";
import type { Locale } from "../shared/types.js";

/**
 * Uso: npm run generate-assets -- [--no-images] [--no-clips] [--no-music] [--no-voice] [--locales=pt-PT,en]
 * Escreve em $CACHE_DIR/generated/manifest.json (servido em /generated/manifest.json).
 */
const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const localesArg = args.find((a) => a.startsWith("--locales="))?.split("=")[1];
const locales = localesArg ? (localesArg.split(",").filter(isLocale) as Locale[]) : undefined;
if (!config.aiEnabled) {
  console.error("FAL_KEY em falta. Define-a no .env ou no ambiente.");
  process.exit(1);
}
await ensureDirs();
const m = await generateAll({ images: !has("--no-images"), clips: !has("--no-clips"), music: !has("--no-music"), voice: !has("--no-voice"), locales });
const clips = Object.values(m.clips).reduce((a, c) => a + Object.keys(c).length, 0);
console.log(`\nConcluído: ${Object.keys(m.mascots).length} mascotes, ${clips} clips, ${Object.keys(m.music).length} músicas, vozes: ${Object.entries(m.voice).map(([l, v]) => `${l}=${Object.keys(v).length}`).join(" ")}`);
