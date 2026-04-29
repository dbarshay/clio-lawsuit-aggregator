type CacheEntry = {
  value: number[];
  expiresAt: number;
};

const CACHE_TTL_MS = 20_000;

const cache = new Map<string, CacheEntry>();

export function getCachedQuery(query: string): number[] | null {
  const key = query.trim();
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

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
