/**
 * In-memory rate limit: 5 запросов / 10 минут на IP.
 */

type Bucket = { timestamps: number[] };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

const buckets = new Map<string, Bucket>();

export function checkRateLimit(ip: string): {
  ok: boolean;
  remaining: number;
} {
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  if (bucket.timestamps.length >= MAX_REQUESTS) {
    buckets.set(ip, bucket);
    return { ok: false, remaining: 0 };
  }

  bucket.timestamps.push(now);
  buckets.set(ip, bucket);
  return { ok: true, remaining: MAX_REQUESTS - bucket.timestamps.length };
}
