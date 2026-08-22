import fs from "node:fs";
import path from "node:path";
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  type ColorwayPhotos,
  type ProductPhotos,
} from "@/lib/productImages";

const EMPTY: ProductPhotos = { front: null, back: null, byColorway: {} };

const EXT = "png|jpe?g|webp";
/** XXYY или kit XXYY-XXYY */
const COLORWAY = "[0-9A-Za-z-]+";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** M1176, KITP1143, TXM1174P193 из имени папки */
function folderProductId(name: string): string {
  const head = name.split("_")[0] ?? name;
  if (/^[A-Za-z]+\d/.test(head)) return head;
  const match = /^([A-Za-z]+\d+(?:[A-Za-z]\d+)?)/.exec(name);
  return match?.[1] ?? name;
}

/**
 * Сканирует public/images/products.
 *
 * Плоские файлы (legacy):
 *   {id}_Front.{ext} / {id}_Back.{ext}
 *
 * Папка артикула (предпочтительно):
 *   products/{id}/...
 *   products/{id}_MAGLIA_NAME/...  — артикул берётся из префикса папки
 *   файлы:
 *   {id}_{colorway}_Front.{ext}  — полный артикул в имени
 *   {colorway}_Front.{ext} / {colorway}_Back.{ext}  (в т.ч. kit 2324-0004)
 *   Front.{ext} / Back.{ext} — общий fallback
 */
function scanProductImages(): Map<string, ProductPhotos> {
  const root = path.join(process.cwd(), "public", "images", "products");
  const map = new Map<string, ProductPhotos>();

  if (!fs.existsSync(root)) {
    return map;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile()) {
      const match = new RegExp(
        `^([A-Za-z0-9]+)_(Front|Back)\\.(${EXT})$`,
        "i",
      ).exec(entry.name);
      if (!match?.[1] || !match[2]) continue;
      const id = match[1];
      const side = match[2].toLowerCase() as "front" | "back";
      const url = `/images/products/${entry.name}`;
      const current = map.get(id) ?? {
        front: null,
        back: null,
        byColorway: {},
      };
      current[side] = url;
      map.set(id, current);
      continue;
    }

    if (!entry.isDirectory()) continue;

    // M1159_MAGLIA_MURCIA → M1159, TXM1174P193_TUTA_... → TXM1174P193
    const id = folderProductId(entry.name);
    const dir = path.join(root, entry.name);
    const current = map.get(id) ?? {
      front: null,
      back: null,
      byColorway: {},
    };

    for (const file of fs.readdirSync(dir)) {
      // M1176_0010_Front.png → colorway 0010
      const fullMatch = new RegExp(
        `^${escapeRegExp(id)}_(${COLORWAY})_(Front|Back)\\.(${EXT})$`,
        "i",
      ).exec(file);
      // 0010_Front.png / 2324-0004_Front.png → colorway
      const colorMatch = new RegExp(
        `^(${COLORWAY})_(Front|Back)\\.(${EXT})$`,
        "i",
      ).exec(file);
      const plainMatch = new RegExp(`^(Front|Back)\\.(${EXT})$`, "i").exec(
        file,
      );
      // 0302.png — один ракурс на расцветку (мячи и т.п.)
      const colorOnlyMatch = new RegExp(
        `^(${COLORWAY})\\.(${EXT})$`,
        "i",
      ).exec(file);

      const matched = fullMatch ?? colorMatch;
      if (matched?.[1] && matched[2]) {
        const colorway = matched[1];
        const side = matched[2].toLowerCase() as "front" | "back";
        const url = `/images/products/${id}/${file}`;
        const slot: ColorwayPhotos = current.byColorway[colorway] ?? {
          front: null,
          back: null,
        };
        slot[side] = url;
        current.byColorway[colorway] = slot;
        if (side === "front" && !current.front) current.front = url;
        if (side === "back" && !current.back) current.back = url;
        continue;
      }

      if (colorOnlyMatch?.[1]) {
        const colorway = colorOnlyMatch[1];
        const url = `/images/products/${id}/${file}`;
        // P281/P281.png — общий front, не код расцветки
        if (colorway.toUpperCase() === id.toUpperCase()) {
          if (!current.front) current.front = url;
          continue;
        }
        const slot: ColorwayPhotos = current.byColorway[colorway] ?? {
          front: null,
          back: null,
        };
        if (!slot.front) slot.front = url;
        current.byColorway[colorway] = slot;
        if (!current.front) current.front = url;
        continue;
      }

      if (plainMatch?.[1]) {
        const side = plainMatch[1].toLowerCase() as "front" | "back";
        const url = `/images/products/${id}/${file}`;
        current[side] = url;
      }
    }

    // Если дефолтного front нет — взять первый colorway по коду
    if (!current.front) {
      const keys = Object.keys(current.byColorway).sort();
      for (const key of keys) {
        const front = current.byColorway[key]?.front;
        if (front) {
          current.front = front;
          break;
        }
      }
    }

    map.set(id, current);
  }

  return map;
}

let scanCache: Map<string, ProductPhotos> | null = null;

function getScanCache(): Map<string, ProductPhotos> {
  if (!scanCache) {
    scanCache = scanProductImages();
  }
  return scanCache;
}

export function getProductPhotos(productId: string): ProductPhotos {
  return getScanCache().get(productId) ?? EMPTY;
}

export function getProductCardSrc(productId: string): string {
  return getProductPhotos(productId).front ?? PRODUCT_IMAGE_PLACEHOLDER;
}

/** Карта front-превью для листинга каталога */
export function getAllProductCardImages(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [id, photos] of getScanCache()) {
    if (photos.front) {
      result[id] = photos.front;
    }
  }
  return result;
}

/** Полные фото по артикулам — для hover-превью в каталоге */
export function getAllProductPhotos(): Record<string, ProductPhotos> {
  const result: Record<string, ProductPhotos> = {};
  for (const [id, photos] of getScanCache()) {
    if (photos.front || Object.keys(photos.byColorway).length > 0) {
      result[id] = photos;
    }
  }
  return result;
}
