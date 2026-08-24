import { ORIGINAL_GLB_ONLY, resolveGlbUrlSync } from "@/lib/models";
import { prefetchImage } from "@/lib/prefetchImages";

const glbLoaded = new Set<string>();
const glbInflight = new Map<string, Promise<void>>();

let sceneModulePromise: Promise<typeof import("@/components/canvas/Scene")> | null =
  null;

/** Предзагрузка GLB в HTTP-кэш (без three.js). */
export function prefetchGlb(url: string): Promise<void> {
  if (!url || glbLoaded.has(url)) return Promise.resolve();
  const pending = glbInflight.get(url);
  if (pending) return pending;

  const promise = fetch(url)
    .then((response) => {
      if (response.ok) glbLoaded.add(url);
    })
    .catch(() => {})
    .finally(() => {
      glbInflight.delete(url);
    });

  glbInflight.set(url, promise);
  return promise;
}

export function prefetchSceneModule(): Promise<
  typeof import("@/components/canvas/Scene")
> {
  if (!sceneModulePromise) {
    sceneModulePromise = import("@/components/canvas/Scene");
  }
  return sceneModulePromise;
}

function runWhenIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(fn, { timeout: 3500 });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 1200);
  return () => window.clearTimeout(id);
}

/**
 * Подготовка 3D — только по запросу (открытие вкладки 3D):
 * GLB → three.js + useGLTF cache (idle). Без albedo/recolor.
 */
export function prefetchProduct3d(
  productId: string,
  model: string | null,
): () => void {
  const glbUrl = resolveGlbUrlSync(null, productId, model);
  if (!glbUrl) return () => {};

  void prefetchGlb(glbUrl);

  if (!ORIGINAL_GLB_ONLY) {
    void import("@/lib/glbColorZones").then(({ getGlbProductZones }) => {
      const zones = getGlbProductZones(productId);
      if (zones?.albedoUrl) void prefetchImage(zones.albedoUrl);
    });
  }

  const cancelIdle = runWhenIdle(() => {
    void Promise.all([
      prefetchSceneModule(),
      import("@react-three/drei"),
    ])
      .then(([, drei]) => {
        drei.useGLTF.preload(glbUrl);
      })
      .catch(() => {});
  });

  return cancelIdle;
}

export function isGlbCached(url: string): boolean {
  return glbLoaded.has(url);
}
