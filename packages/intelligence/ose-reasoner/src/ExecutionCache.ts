// THE SEED v2.0 - OSE Execution Cache
// Caching for OSE execution results

import { CompiledIAL } from '@taowind/ial-compiler';
import { OSEState } from './Core';

/**
 * Execution Cache Entry
 */
interface CacheEntry {
  result: any;
  state: OSEState;
  timestamp: number;
  hitCount: number;
}

/**
 * OSE Execution Cache
 * Caches execution results for performance
 */
export class OSEExecutionCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 50;
  private ttl: number = 10 * 60 * 1000; // 10 minutes

  /**
   * Generate cache key from compiled IAL
   */
  private generateKey(compiled: CompiledIAL): string {
    return JSON.stringify({
      domain: compiled.domain,
      operation: compiled.operation,
      glyphs: compiled.glyphs,
      modifiers: compiled.modifiers,
      target: compiled.target,
    });
  }

  /**
   * Get cached result
   */
  get(compiled: CompiledIAL): { result: any; state: OSEState } | null {
    const key = this.generateKey(compiled);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hitCount++;
    
    return {
      result: entry.result,
      state: JSON.parse(JSON.stringify(entry.state)), // Deep copy
    };
  }

  /**
   * Set cache entry
   */
  set(compiled: CompiledIAL, result: any, state: OSEState): void {
    // Check if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const key = this.generateKey(compiled);
    this.cache.set(key, {
      result,
      state: JSON.parse(JSON.stringify(state)), // Deep copy
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
    totalHits: number;
  } {
    let totalHits = 0;
    
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      totalHits,
    };
  }

  /**
   * Invalidate cache entry
   */
  invalidate(compiled: CompiledIAL): void {
    const key = this.generateKey(compiled);
    this.cache.delete(key);
  }
}

