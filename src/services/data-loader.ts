import { appLogger } from "./app-logger"

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

export class DataLoader {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private pendingRequests: Map<string, Promise<any>> = new Map()
  private defaultTtl: number

  constructor(defaultTtlMs: number = 30000) {
    this.defaultTtl = defaultTtlMs
  }

  /**
   * Loads data from cache or executes the fetcher function.
   * Deduplicates concurrent requests for the same key.
   * 
   * @param key Unique key for the data
   * @param fetcher Function that returns a promise with the data
   * @param ttlMs Optional TTL for this specific request (overrides default)
   */
  async load<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const now = Date.now()
    const cached = this.cache.get(key)

    // Return cached data if valid
    if (cached && now < cached.expiresAt) {
      appLogger.debug(`[DataLoader] Cache hit for ${key}`)
      return cached.data as T
    }

    // If a request is already in flight for this key, return that promise
    if (this.pendingRequests.has(key)) {
      appLogger.debug(`[DataLoader] Deduplicating request for ${key}`)
      return this.pendingRequests.get(key) as Promise<T>
    }

    // Execute fetcher
    const promise = fetcher()
      .then((data) => {
        const ttl = ttlMs ?? this.defaultTtl
        this.cache.set(key, {
          data,
          timestamp: now,
          expiresAt: now + ttl,
        })
        this.pendingRequests.delete(key)
        return data
      })
      .catch((error) => {
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Clears a specific cache entry or all entries if no key provided.
   */
  clear(key?: string) {
    if (key) {
      this.cache.delete(key)
      appLogger.debug(`[DataLoader] Cleared cache for ${key}`)
    } else {
      this.cache.clear()
      appLogger.debug("[DataLoader] Cleared all cache")
    }
  }

  /**
   * Invalidates cache entries matching a prefix
   */
  invalidatePrefix(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }
}
