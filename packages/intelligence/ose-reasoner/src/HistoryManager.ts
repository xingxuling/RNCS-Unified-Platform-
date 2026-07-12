// THE SEED v2.0 - OSE History Manager
// Manages execution history and replay functionality

import { OSEState } from './Core';
import { CompiledIAL } from '@taowind/ial-compiler';

/**
 * History Entry
 */
interface HistoryEntry {
  timestamp: number;
  compiled: CompiledIAL;
  stateBefore: OSEState;
  stateAfter: OSEState;
  result: any;
}

/**
 * OSE History Manager
 * Tracks execution history for replay and debugging
 */
export class OSEHistoryManager {
  private history: HistoryEntry[] = [];
  private maxHistorySize: number = 1000;
  private currentIndex: number = -1;
  private _isReplaying: boolean = false;

  /**
   * Add entry to history
   */
  addEntry(
    compiled: CompiledIAL,
    stateBefore: OSEState,
    stateAfter: OSEState,
    result: any
  ): void {
    // Remove entries after current index (if we're in the middle of history)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new entry
    this.history.push({
      timestamp: Date.now(),
      compiled,
      stateBefore: JSON.parse(JSON.stringify(stateBefore)), // Deep copy
      stateAfter: JSON.parse(JSON.stringify(stateAfter)), // Deep copy
      result: JSON.parse(JSON.stringify(result)), // Deep copy
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): OSEState | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }
    return this.history[this.currentIndex].stateAfter;
  }

  /**
   * Get history entry at index
   */
  getEntry(index: number): HistoryEntry | null {
    if (index < 0 || index >= this.history.length) {
      return null;
    }
    return this.history[index];
  }

  /**
   * Get all history entries
   */
  getAllEntries(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get history entries in range
   */
  getEntriesInRange(start: number, end: number): HistoryEntry[] {
    return this.history.slice(start, end);
  }

  /**
   * Step forward in history
   */
  stepForward(): OSEState | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex].stateAfter;
    }
    return null;
  }

  /**
   * Step backward in history
   */
  stepBackward(): OSEState | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex].stateAfter;
    }
    return null;
  }

  /**
   * Jump to specific index
   */
  jumpTo(index: number): OSEState | null {
    if (index >= 0 && index < this.history.length) {
      this.currentIndex = index;
      return this.history[index].stateAfter;
    }
    return null;
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get history length
   */
  getLength(): number {
    return this.history.length;
  }

  /**
   * Check if can step forward
   */
  canStepForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Check if can step backward
   */
  canStepBackward(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Export history
   */
  export(): string {
    return JSON.stringify({
      history: this.history,
      currentIndex: this.currentIndex,
      timestamp: Date.now(),
    }, null, 2);
  }

  /**
   * Import history
   */
  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.history && Array.isArray(parsed.history)) {
        this.history = parsed.history;
        this.currentIndex = parsed.currentIndex ?? this.history.length - 1;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number;
    currentIndex: number;
    canGoBack: boolean;
    canGoForward: boolean;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    return {
      totalEntries: this.history.length,
      currentIndex: this.currentIndex,
      canGoBack: this.canStepBackward(),
      canGoForward: this.canStepForward(),
      oldestTimestamp: this.history.length > 0 ? this.history[0].timestamp : null,
      newestTimestamp: this.history.length > 0 ? this.history[this.history.length - 1].timestamp : null,
    };
  }

  /**
   * Set replay mode
   */
  setReplaying(replaying: boolean): void {
    this._isReplaying = replaying;
  }

  /**
   * Check if replaying
   */
  getIsReplaying(): boolean {
    return this._isReplaying;
  }
}

