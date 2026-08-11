import fs from "node:fs";
import path from "node:path";
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  type ColorwayPhotos,
  type ProductPhotos,
} from "@/lib/productImages";

const EMPTY: ProductPhotos = { front: null, back: null, byColorway: {} };

const EXT = "png|jpe?g|webp";

/**
 * Сканирует public/images/products.
 *
 * Плоские файлы (legacy):
 *   {id}_Front.{ext} / {id}_Back.{ext}
 *
 * Папка артикула (предпочтительно):
 *   products/{id}/{colorway}_Front.{ext}
 *   products/{id}/{colorway}_Back.{ext}
 *   products/{id}/Front.{ext} / Back.{ext} — общий fallback
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

    const id = entry.name;
    const dir = path.join(root, id);
    const current = map.get(id) ?? {
      front: null,
      back: null,
      byColorway: {},
    };

    for (const file of fs.readdirSync(dir)) {
      const colorMatch = new RegExp(
        `^([0-9A-Za-z]+)_(Front|Back)\\.(${EXT})$`,
        "i",
      ).exec(file);
      const plainMatch = new RegExp(`^(Front|Back)\\.(${EXT})$`, "i").exec(
        file,
      );

      if (colorMatch?.[1] && colorMatch[2]) {
        const colorway = colorMatch[1];
        const side = colorMatch[2].toLowerCase() as "front" | "back";
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

export function getProductPhotos(productId: string): ProductPhotos {
  return scanProductImages().get(productId) ?? EMPTY;
}

export function getProductCardSrc(productId: string): string {
  return getProductPhotos(productId).front ?? PRODUCT_IMAGE_PLACEHOLDER;
}

/** Карта front-превью для листинга каталога */
export function getAllProductCardImages(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [id, photos] of scanProductImages()) {
    if (photos.front) {
      result[id] = photos.front;
    }
  }
  return result;
}
