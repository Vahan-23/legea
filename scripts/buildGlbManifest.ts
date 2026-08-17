/**
 * Список реальных GLB в public/3D → data/glbManifest.json
 * (без HEAD-проверок в рантайме).
 *
 * Usage: npx tsx scripts/buildGlbManifest.ts
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GLB_DIR = path.join(ROOT, "public", "3D");
const OUT = path.join(ROOT, "data", "glbManifest.json");

function productIdFromGlbName(file: string): string | null {
  const base = file.replace(/\.glb$/i, "");
  if (/^logo/i.test(base) || /_3D1$/i.test(base)) return null;
  const named = /^([A-Za-z0-9]+)_3D$/i.exec(base);
  if (named?.[1]) return named[1];
  if (/^[A-Za-z0-9]+$/.test(base)) return base;
  return null;
}

function main() {
  const files = fs.existsSync(GLB_DIR)
    ? fs.readdirSync(GLB_DIR).filter((f) => /\.glb$/i.test(f))
    : [];

  /** Предпочитаем *_3D.glb */
  const byId: Record<string, string> = {};
  for (const file of files) {
    const id = productIdFromGlbName(file);
    if (!id) continue;
    const url = `/3D/${file}`;
    const prev = byId[id];
    if (!prev || /_3D\.glb$/i.test(file)) {
      byId[id] = url;
    }
  }

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    files: byId,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT} (${Object.keys(byId).length} products)`);
}

main();
