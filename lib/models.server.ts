import fs from "node:fs";
import path from "node:path";

/**
 * Артикулы с пер-продуктовым GLB в public/3D:
 *   {id}_3D.glb  (предпочтительно)
 *   {id}.glb
 * Служебные файлы (logo_3d, {id}_3D1) не считаются.
 */
export function getProductIdsWithGlb(): Set<string> {
  const root = path.join(process.cwd(), "public", "3D");
  const ids = new Set<string>();

  if (!fs.existsSync(root)) return ids;

  for (const file of fs.readdirSync(root)) {
    const named = /^([A-Za-z0-9]+)_3D\.glb$/.exec(file);
    if (named?.[1]) {
      ids.add(named[1]);
      continue;
    }
    const plain = /^([A-Za-z0-9]+)\.glb$/.exec(file);
    if (plain?.[1]) ids.add(plain[1]);
  }

  return ids;
}
