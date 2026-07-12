// THE SEED v2.0 - OSE Error Recovery
// Error recovery and state restoration

import { OSEState } from './Core';
import { OSECore } from './Core';

/**
 * Recovery Strategy
 */
export enum RecoveryStrategy {
  ROLLBACK = 'rollback',
  RESET = 'reset',
  CONTINUE = 'continue',
  SKIP = 'skip',
}

/**
 * Error Recovery Handler
 */
export class OSEErrorRecovery {
  private stateHistory: OSEState[] = [];
  private maxHistorySize = 50;

  /**
   * Save state for recovery
   */
  saveState(state: OSEState): void {
    this.stateHistory.push(JSON.parse(JSON.stringify(state))); // Deep copy
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Recover from error
   */
  recover(
    error: Error,
    currentState: OSEState,
    core: OSECore
  ): { strategy: RecoveryStrategy; state?: OSEState } {
    // Analyze error
    const errorType = this.analyzeError(error);
    
    switch (errorType) {
      case 'state_corruption':
        return this.recoverFromCorruption(currentState, core);
      
      case 'invalid_operation':
        return this.recoverFromInvalidOperation(currentState, core);
      
      case 'resource_exhaustion':
        return this.recoverFromResourceExhaustion(currentState, core);
      
      default:
        return this.recoverDefault(currentState, core);
    }
  }

  /**
   * Analyze error type
   */
  private analyzeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('corrupt') || message.includes('invalid state')) {
      return 'state_corruption';
    }
    
    if (message.includes('invalid') || message.includes('not allowed')) {
      return 'invalid_operation';
    }
    
    if (message.includes('memory') || message.includes('limit') || message.includes('exceed')) {
      return 'resource_exhaustion';
    }
    
    return 'unknown';
  }

  /**
   * Recover from state corruption
   */
  private recoverFromCorruption(
    currentState: OSEState,
    core: OSECore
  ): { strategy: RecoveryStrategy; state?: OSEState } {
    // Try to rollback to last known good state
    if (this.stateHistory.length > 0) {
      const lastGoodState = this.stateHistory[this.stateHistory.length - 1];
      return {
        strategy: RecoveryStrategy.ROLLBACK,
        state: lastGoodState,
      };
    }
    
    // If no history, reset
    return {
      strategy: RecoveryStrategy.RESET,
    };
  }

  /**
   * Recover from invalid operation
   */
  private recoverFromInvalidOperation(
    currentState: OSEState,
    core: OSECore
  ): { strategy: RecoveryStrategy; state?: OSEState } {
    // Skip the operation and continue
    return {
      strategy: RecoveryStrategy.SKIP,
      state: currentState,
    };
  }

  /**
   * Recover from resource exhaustion
   */
  private recoverFromResourceExhaustion(
    currentState: OSEState,
    core: OSECore
  ): { strategy: RecoveryStrategy; state?: OSEState } {
    // Clean up and continue with reduced resources
    const cleanedState = this.cleanupState(currentState);
    return {
      strategy: RecoveryStrategy.CONTINUE,
      state: cleanedState,
    };
  }

  /**
   * Default recovery
   */
  private recoverDefault(
    currentState: OSEState,
    core: OSECore
  ): { strategy: RecoveryStrategy; state?: OSEState } {
    // Try to continue with current state
    return {
      strategy: RecoveryStrategy.CONTINUE,
      state: currentState,
    };
  }

  /**
   * Cleanup state to reduce resource usage
   */
  private cleanupState(state: OSEState): OSEState {
    const cleaned = JSON.parse(JSON.stringify(state)); // Deep copy
    
    // Limit blue layer nodes
    if (cleaned.blue.nodes.length > 100) {
      cleaned.blue.nodes = cleaned.blue.nodes.slice(-100);
    }
    
    // Limit blue layer edges
    if (cleaned.blue.edges.length > 200) {
      cleaned.blue.edges = cleaned.blue.edges.slice(-200);
    }
    
    // Clear old grids
    if (cleaned.blue.grids.length > 10) {
      cleaned.blue.grids = cleaned.blue.grids.slice(-10);
    }
    
    return cleaned;
  }

  /**
   * Get recovery suggestion
   */
  getRecoverySuggestion(strategy: RecoveryStrategy): string {
    switch (strategy) {
      case RecoveryStrategy.ROLLBACK:
        return '已回滚到上一个稳定状态';
      case RecoveryStrategy.RESET:
        return '已重置 OSE 引擎到初始状态';
      case RecoveryStrategy.CONTINUE:
        return '已清理资源，继续执行';
      case RecoveryStrategy.SKIP:
        return '已跳过无效操作，继续执行';
      default:
        return '尝试恢复中...';
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Get history size
   */
  getHistorySize(): number {
    return this.stateHistory.length;
  }
}

