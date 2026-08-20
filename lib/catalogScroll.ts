const STORAGE_KEY = "legea:catalog-focus";

export type CatalogFocus = {
  productId: string;
  /** querystring без `?`, например `type=tute&category=calcio` */
  search: string;
};

export function saveCatalogFocus(productId: string, search = ""): void {
  try {
    const payload: CatalogFocus = { productId, search };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
}

export function peekCatalogFocus(): CatalogFocus | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogFocus;
    if (!parsed?.productId || typeof parsed.productId !== "string") return null;
    return {
      productId: parsed.productId,
      search: typeof parsed.search === "string" ? parsed.search : "",
    };
  } catch {
    return null;
  }
}

export function consumeCatalogFocus(): CatalogFocus | null {
  const focus = peekCatalogFocus();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return focus;
}

export function catalogHrefFromFocus(focus: CatalogFocus | null): string {
  if (!focus?.search) return "/catalog";
  return `/catalog?${focus.search}`;
}
