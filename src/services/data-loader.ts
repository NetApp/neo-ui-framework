import { appLogger } from "./app-logger"

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  size: number
}

export class DataLoader {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private pendingRequests: Map<string, Promise<any>> = new Map()
  private defaultTtl: number
  private maxSizeBytes: number
  private currentSizeBytes: number = 0

  constructor(defaultTtlMs: number = 30000, maxSizeBytes: number = 100 * 1024 * 1024) { // Default 100MB
    this.defaultTtl = defaultTtlMs
    this.maxSizeBytes = maxSizeBytes
  }

  /**
   * Calculates approximate size of data in bytes.
   */
  private calculateSize(data: any): number {
    try {
      const json = JSON.stringify(data)
      return new TextEncoder().encode(json).length
    } catch (e) {
      // Fallback for non-serializable data or errors
      return 1024 // Assume 1KB minimum
    }
  }

  /**
   * Evicts least recently used items until there is space for new data.
   */
  private evict(requiredSize: number) {
    if (requiredSize > this.maxSizeBytes) {
      appLogger.warn(`[DataLoader] Item size ${requiredSize} exceeds max cache size ${this.maxSizeBytes}. It will not be cached.`)
      return false
    }

    // Map iterates in insertion order. Re-inserting an item (get/set) moves it to the end.
    // So the first item in the iterator is the least recently used.
    const iterator = this.cache.keys()

    while (this.currentSizeBytes + requiredSize > this.maxSizeBytes) {
      const key = iterator.next().value
      if (!key) break // Should not happen if size tracking is correct

      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.currentSizeBytes -= entry.size
        appLogger.debug(`[DataLoader] Evicted ${key} to free ${entry.size} bytes`)
      }
    }
    return true
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
      appLogger.debug(`[DataLoader] Cache HIT for ${key}`)
      // Refresh LRU order by deleting and re-inserting
      this.cache.delete(key)
      this.cache.set(key, cached)
      return cached.data as T
    }

    appLogger.debug(`[DataLoader] Cache MISS for ${key}`)

    // If a request is already in flight for this key, return that promise
    if (this.pendingRequests.has(key)) {
      appLogger.debug(`[DataLoader] Deduplicating request for ${key}`)
      return this.pendingRequests.get(key) as Promise<T>
    }

    // Execute fetcher
    const promise = fetcher()
      .then((data) => {
        const ttl = ttlMs ?? this.defaultTtl
        const size = this.calculateSize(data)

        // Try to evict space for new item
        if (this.evict(size)) {
          this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + ttl,
            size,
          })
          this.currentSizeBytes += size
          appLogger.debug(`[DataLoader] Cached ${key} (TTL: ${ttl}ms, Size: ${size}b)`)
        }

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
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.currentSizeBytes -= entry.size
        appLogger.debug(`[DataLoader] Cleared cache for ${key}`)
      }
    } else {
      this.cache.clear()
      this.currentSizeBytes = 0
      appLogger.debug("[DataLoader] Cleared all cache")
    }
  }

  /**
   * Invalidates cache entries matching a prefix
   */
  invalidatePrefix(prefix: string) {
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
        this.currentSizeBytes -= entry.size
      }
    }
  }

  /**
   * Returns current cache stats
   */
  getStats() {
    return {
      sizeBytes: this.currentSizeBytes,
      maxSizeBytes: this.maxSizeBytes,
      items: this.cache.size
    }
  }

  /**
   * Returns a specific cache entry metadata if it exists
   */
  getEntry<T>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key)
  }

  /**
   * Updates max size configuration
   */
  setMaxSize(bytes: number) {
    this.maxSizeBytes = bytes
    // Trigger eviction if new size is smaller
    this.evict(0)
  }
}
