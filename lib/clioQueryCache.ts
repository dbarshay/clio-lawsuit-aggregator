type CacheEntry = {
  value: number[];
  expiresAt: number;
};

const CACHE_TTL_MS = 20_000;

const cache = new Map<string, CacheEntry>();

// ---- METRICS ----
let cacheHits = 0;
let cacheMisses = 0;

export function getCacheMetrics() {
  return {
    cacheHits,
    cacheMisses,
  };
}

export function resetCacheMetrics() {
  cacheHits = 0;
  cacheMisses = 0;
}

// ---- CACHE ----
export function getCachedQuery(query: string): number[] | null {
  const key = query.trim();
  const entry = cache.get(key);

  if (!entry) {
    cacheMisses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    cacheMisses++;
    return null;
  }

  cacheHits++;
  return entry.value;
}

export function setCachedQuery(query: string, value: number[]) {
  const key = query.trim();

  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function clearQueryCache() {
  cache.clear();
}
