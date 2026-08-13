/** Клиентский кэш уже загруженных URL (фото товаров). */
const loaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();

export function isImageCached(url: string): boolean {
  return loaded.has(url);
}

/** Предзагрузка одного URL через браузерный cache. */
export function prefetchImage(url: string): Promise<void> {
  if (!url || loaded.has(url)) return Promise.resolve();
  const pending = inflight.get(url);
  if (pending) return pending;

  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      loaded.add(url);
      inflight.delete(url);
      resolve();
    };
    img.onerror = () => {
      inflight.delete(url);
      resolve();
    };
    img.src = url;
  });

  inflight.set(url, promise);
  return promise;
}

/** По одному URL с паузой — не блокирует главный поток. */
export function prefetchImagesQueued(
  urls: string[],
  gapMs = 250,
): () => void {
  let cancelled = false;
  let idx = 0;
  let timerId = 0;

  const step = () => {
    if (cancelled || idx >= urls.length) return;
    const url = urls[idx];
    idx += 1;
    if (url) void prefetchImage(url);
    timerId = window.setTimeout(step, gapMs);
  };

  timerId = window.setTimeout(step, 600);

  return () => {
    cancelled = true;
    window.clearTimeout(timerId);
  };
}
