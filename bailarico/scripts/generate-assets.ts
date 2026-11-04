import { ensureDirs } from "../server/cache.js";
import { config } from "../server/config.js";
import { generateAll } from "../server/generate.js";

/**
 * Uso: npm run generate-assets -- [--videos] [--no-music] [--no-voice] [--no-images]
 * Escreve em $CACHE_DIR/generated/manifest.json (servido em /generated/manifest.json).
 */
const args = new Set(process.argv.slice(2));
if (!config.aiEnabled) {
  console.error("FAL_KEY em falta. Define-a no .env ou no ambiente.");
  process.exit(1);
}
await ensureDirs();
const manifest = await generateAll({
  images: !args.has("--no-images"),
  videos: args.has("--videos"),
  music: !args.has("--no-music"),
  voice: !args.has("--no-voice"),
});
console.log(`\nConcluído. ${Object.keys(manifest.voice).length} vozes, ${Object.keys(manifest.mascots).length} mascotes, ${Object.keys(manifest.music).length} músicas.`);
