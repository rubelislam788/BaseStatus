type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MemoryCache implements CacheAdapter {
  private store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string) {
    this.store.delete(key);
  }
}

export const cache: CacheAdapter = new MemoryCache();

export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>) {
  const hit = await cache.get<T>(key);
  if (hit) return hit;
  const value = await loader();
  await cache.set(key, value, ttlSeconds);
  return value;
}
