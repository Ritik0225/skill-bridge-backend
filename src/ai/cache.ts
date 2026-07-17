/**
 * Tiny in-memory cache for AI results, keyed by a content hash.
 * Purpose: never pay (quota + latency) to recompute an identical request.
 * FIFO eviction keeps memory bounded. Process-local by design; a shared
 * (Mongo/Redis) cache is a later scaling step.
 */
const MAX_ENTRIES = 500;
const store = new Map<string, unknown>();

export const aiCache = {
  get<T>(key: string): T | undefined {
    return store.get(key) as T | undefined;
  },
  set(key: string, value: unknown): void {
    if (store.size >= MAX_ENTRIES) {
      const oldest = store.keys().next().value;
      if (oldest !== undefined) store.delete(oldest);
    }
    store.set(key, value);
  },
  clear(): void {
    store.clear();
  },
};
