// In-process TTL cache with single-flight de-duplication.
//
// Second line of defence behind the Vercel edge cache. The CDN collapses
// thousands of 5-second polls into roughly one origin request per interval
// *per edge region*; this cache absorbs whatever still lands on a warm
// lambda, and — more importantly — guarantees that N simultaneous misses
// trigger exactly ONE MongoDB aggregation instead of N of them.
//
// Scope is a single lambda instance and it dies with the instance, which is
// exactly what we want: no invalidation to get wrong, staleness bounded by
// the TTL.

type Entry<T> = {
  value: T;
  expiresAt: number;
  inflight: Promise<T> | null;
};

const globalWithCache = globalThis as typeof globalThis & {
  __expeditionCache?: Map<string, Entry<unknown>>;
};

const store: Map<string, Entry<unknown>> =
  globalWithCache.__expeditionCache ?? (globalWithCache.__expeditionCache = new Map());

/**
 * Returns the cached value for `key`, or computes it with `producer`.
 *
 * Concurrent callers that miss share one `producer` call. If a refresh
 * fails but a stale value is still held, the stale value is served rather
 * than propagating the error — during a live event a slightly old
 * leaderboard beats a broken one.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as Entry<T> | undefined;

  if (entry && entry.expiresAt > now) return entry.value;
  if (entry?.inflight) return entry.inflight;

  const inflight = producer()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs, inflight: null });
      return value;
    })
    .catch((err) => {
      const previous = store.get(key) as Entry<T> | undefined;
      if (previous) {
        previous.inflight = null;
        // Serve stale for one more TTL window instead of failing outright.
        previous.expiresAt = Date.now() + ttlMs;
        return previous.value;
      }
      store.delete(key);
      throw err;
    });

  store.set(key, {
    value: entry?.value as T,
    expiresAt: entry?.expiresAt ?? 0,
    inflight,
  });

  return inflight;
}

/** Drop a cached entry so the next read recomputes (used after admin writes). */
export function invalidate(key: string): void {
  store.delete(key);
}

export const CacheKeys = {
  leaderboard: (limit: number) => `leaderboard:${limit}`,
  productStats: 'product-stats',
  eventStats: 'event-stats',
} as const;
