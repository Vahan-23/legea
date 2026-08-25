import { ORIGINAL_GLB_ONLY, resolveGlbUrlSync } from "@/lib/models";
import { prefetchImage } from "@/lib/prefetchImages";

const glbLoaded = new Set<string>();
const glbInflight = new Map<string, Promise<void>>();
const gltfPreloaded = new Set<string>();

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

function runWhenIdle(fn: () => void, timeoutMs = 1200): () => void {
  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(fn, { timeout: timeoutMs });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, Math.min(400, timeoutMs));
  return () => window.clearTimeout(id);
}

async function preloadGltf(glbUrl: string): Promise<void> {
  if (!glbUrl || gltfPreloaded.has(glbUrl)) return;
  const [, drei] = await Promise.all([
    prefetchSceneModule(),
    import("@react-three/drei"),
  ]);
  drei.useGLTF.preload(glbUrl);
  gltfPreloaded.add(glbUrl);
}

/**
 * Фоновая подготовка 3D при открытии карточки:
 * 1) сразу качаем GLB в HTTP-кэш
 * 2) почти сразу тянем Scene/three chunk
 * 3) после GLB — useGLTF.preload в кэш three
 */
export function prefetchProduct3d(
  productId: string,
  model: string | null,
): () => void {
  const glbUrl = resolveGlbUrlSync(null, productId, model);
  if (!glbUrl) return () => {};

  let cancelled = false;
  const cancelFns: Array<() => void> = [];

  void prefetchGlb(glbUrl);

  if (!ORIGINAL_GLB_ONLY) {
    void import("@/lib/glbColorZones").then(({ getGlbProductZones }) => {
      if (cancelled) return;
      const zones = getGlbProductZones(productId);
      if (zones?.albedoUrl) void prefetchImage(zones.albedoUrl);
    });
  }

  // Не блокируем первый paint: через короткий idle тянем JS three/Scene
  cancelFns.push(
    runWhenIdle(() => {
      if (cancelled) return;
      void prefetchSceneModule();
    }, 800),
  );

  // Когда GLB в кэше — кладём в useGLTF (основная задержка при клике на 3D)
  void prefetchGlb(glbUrl).then(() => {
    if (cancelled) return;
    cancelFns.push(
      runWhenIdle(() => {
        if (cancelled) return;
        void preloadGltf(glbUrl).catch(() => {});
      }, 600),
    );
  });

  return () => {
    cancelled = true;
    for (const cancel of cancelFns) cancel();
  };
}

export function isGlbCached(url: string): boolean {
  return glbLoaded.has(url);
}
