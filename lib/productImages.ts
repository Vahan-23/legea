export const PRODUCT_IMAGE_PLACEHOLDER = "/images/product-placeholder.svg";

export type ColorwayPhotos = {
  front: string | null;
  back: string | null;
};

export type ProductPhotos = {
  /** Дефолт / первый найденный front (для каталога) */
  front: string | null;
  back: string | null;
  /** Фото по коду расцветки XXYY */
  byColorway: Record<string, ColorwayPhotos>;
};

export function resolveColorwayPhotos(
  photos: ProductPhotos | undefined,
  colorway: string | null,
): ColorwayPhotos {
  if (!photos) return { front: null, back: null };
  if (colorway && photos.byColorway[colorway]) {
    const entry = photos.byColorway[colorway];
    return {
      front: entry.front ?? photos.front,
      back: entry.back ?? photos.back,
    };
  }
  return { front: photos.front, back: photos.back };
}
