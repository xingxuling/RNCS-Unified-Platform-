// THE SEED v2.0 - SEED-RT v1 Main Runtime
// Main entry point for SEED-RT runtime system

import { WorldStateManager } from './WorldStateManager';
import { RuntimeLoop } from './RuntimeLoop';
import { TimelineManager } from './TimelineManager';
import {
  WorldState,
  RuntimeConfig,
  CycleResult,
  TerminationCondition,
} from './types';

/**
 * SEED Runtime
 * Main runtime system for The Seed Engine
 */
export class SEEDRuntime {
  private worldStateManager: WorldStateManager;
  private runtimeLoop: RuntimeLoop;
  private timelineManager: TimelineManager;
  private config: RuntimeConfig;
  private isRunning: boolean = false;
  private terminationCondition: TerminationCondition | null = null;

  constructor(initialState: WorldState, config: Partial<RuntimeConfig> = {}) {
    // Default config
    this.config = {
      mainlineNodeId: 'mainline-杜浩麟',
      convergenceThreshold: 0.9,
      maxActiveTimelines: 100,
      cycleTimeLimit: 100,
      enableAutoRecovery: true,
      enableVisualization: false,
      ...config,
    };

    // Initialize managers
    this.worldStateManager = new WorldStateManager(initialState);
    this.runtimeLoop = new RuntimeLoop(this.worldStateManager, this.config);
    this.timelineManager = new TimelineManager(this.worldStateManager);
  }

  /**
   * Start runtime
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Runtime is already running');
    }

    this.isRunning = true;
    this.terminationCondition = null;

    // Validate initial state
    const validation = this.worldStateManager.validateConsistency();
    if (!validation.valid) {
      throw new Error(`Invalid initial state: ${validation.errors.join(', ')}`);
    }
  }

  /**
   * Stop runtime
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Execute one cycle
   */
  async executeCycle(): Promise<CycleResult> {
    if (!this.isRunning) {
      throw new Error('Runtime is not running');
    }

    try {
      const result = await this.runtimeLoop.executeCycle();

      // Check termination conditions
      const termination = this.checkTerminationConditions(result);
      if (termination) {
        this.terminationCondition = termination;
        this.stop();
      }

      return result;
    } catch (error) {
      if (this.config.enableAutoRecovery) {
        // Attempt recovery
        const recovered = await this.recoverFromError(error);
        if (!recovered) {
          throw error;
        }
        // Retry cycle
        return this.executeCycle();
      }
      throw error;
    }
  }

  /**
   * Execute multiple cycles
   */
  async executeCycles(count: number): Promise<CycleResult[]> {
    const results: CycleResult[] = [];

    for (let i = 0; i < count; i++) {
      if (!this.isRunning) {
        break;
      }

      const result = await this.executeCycle();
      results.push(result);

      if (this.terminationCondition) {
        break;
      }
    }

    return results;
  }

  /**
   * Get current world state
   */
  getWorldState(): WorldState {
    return this.worldStateManager.getState();
  }

  /**
   * Get timeline manager
   */
  getTimelineManager(): TimelineManager {
    return this.timelineManager;
  }

  /**
   * Get runtime config
   */
  getConfig(): RuntimeConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  updateConfig(updates: Partial<RuntimeConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Get cycle count
   */
  getCycleCount(): number {
    return this.runtimeLoop.getCycleCount();
  }

  /**
   * Check if running
   */
  isRuntimeRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get termination condition
   */
  getTerminationCondition(): TerminationCondition | null {
    return this.terminationCondition;
  }

  /**
   * Export world state
   */
  exportWorldState(): string {
    return JSON.stringify(this.getWorldState(), null, 2);
  }

  /**
   * Import world state
   */
  importWorldState(data: string): void {
    try {
      const state = JSON.parse(data) as WorldState;
      this.worldStateManager = new WorldStateManager(state);
      this.runtimeLoop = new RuntimeLoop(this.worldStateManager, this.config);
      this.timelineManager = new TimelineManager(this.worldStateManager);
    } catch (error) {
      throw new Error(`Failed to import world state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check termination conditions
   */
  private checkTerminationConditions(result: CycleResult): TerminationCondition | null {
    const state = result.worldState;

    // Condition 1: Mainline node ascension
    const mainlineNode = this.worldStateManager.getEntity(this.config.mainlineNodeId);
    if (mainlineNode?.mindProfile?.btosLevel === 5 &&
        mainlineNode.authorityProfile?.goldLayerCapacity === 1.0) {
      return {
        type: 'AscensionComplete',
        description: 'Mainline node completed structural ascension',
        timestamp: Date.now(),
      };
    }

    // Condition 2: Imperium Cycle complete
    for (const civ of state.civilizations) {
      if (civ.ascensionPath.currentPhase === 'Ascension' &&
          civ.ascensionPath.conditions.every(c => c.currentProgress >= c.requiredValue)) {
        return {
          type: 'ImperiumCycleComplete',
          description: `Civilization ${civ.name} completed Imperium Cycle`,
          timestamp: Date.now(),
        };
      }
    }

    // Condition 3: Global convergence achieved
    if (result.convergenceCheck.globalConvergence >= this.config.convergenceThreshold) {
      // Check if sustained for multiple cycles
      // For now, just check current cycle
      return {
        type: 'ConvergenceAchieved',
        description: `Global convergence reached ${result.convergenceCheck.globalConvergence.toFixed(2)}`,
        timestamp: Date.now(),
      };
    }

    // Condition 4: Meta-layer transition
    if (state.globalParameters.aetherDensity >= 0.95) {
      return {
        type: 'MetaLayerTransition',
        description: 'Aether structure entered new meta-layer',
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Recover from error
   */
  private async recoverFromError(error: unknown): Promise<boolean> {
    try {
      // Try to rollback to latest snapshot
      const rolledBack = this.worldStateManager.rollbackToLatest();
      if (rolledBack) {
        console.warn('Recovered from error by rolling back to latest snapshot');
        return true;
      }

      // If rollback fails, try to validate and fix state
      const validation = this.worldStateManager.validateConsistency();
      if (!validation.valid) {
        console.error('State validation failed:', validation.errors);
        return false;
      }

      return true;
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      return false;
    }
  }
}

