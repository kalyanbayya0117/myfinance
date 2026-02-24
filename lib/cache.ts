type CacheItem<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheItem<unknown>>();

export function getCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return item.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearCachePrefix(prefix: string) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
