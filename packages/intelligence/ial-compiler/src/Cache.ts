// THE SEED v2.0 - IAL Compilation Cache
// Caching for compiled IAL expressions

import { CompilationResult } from './Compiler';

/**
 * Cache Entry
 */
interface CacheEntry {
  result: CompilationResult;
  timestamp: number;
  hitCount: number;
}

/**
 * IAL Compilation Cache
 * Caches compilation results for performance
 */
export class IALCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 100;
  private ttl: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached result
   */
  get(source: string): CompilationResult | null {
    const entry = this.cache.get(source);
    
    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(source);
      return null;
    }

    // Update hit count
    entry.hitCount++;
    
    return entry.result;
  }

  /**
   * Set cache entry
   */
  set(source: string, result: CompilationResult): void {
    // Check if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(source, {
      result,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ source: string; hits: number; age: number }>;
  } {
    let totalHits = 0;
    const entries: Array<{ source: string; hits: number; age: number }> = [];

    for (const [source, entry] of this.cache.entries()) {
      totalHits += entry.hitCount;
      entries.push({
        source: source.substring(0, 50), // Truncate for display
        hits: entry.hitCount,
        age: Date.now() - entry.timestamp,
      });
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalHits / Math.max(1, this.cache.size),
      entries: entries.sort((a, b) => b.hits - a.hits),
    };
  }

  /**
   * Invalidate cache entry
   */
  invalidate(source: string): void {
    this.cache.delete(source);
  }
}

