// THE SEED v2.0 - AGI Backend - SEED-RT Service
// Service layer for runtime execution

import { SEEDRuntime, WorldState, Timeline, ConvergenceCheck } from '../../seed-rt';
import { UniverseForgeAdapter } from '../../seed-rt/UniverseForgeAdapter';

/**
 * Runtime ID type
 */
export type RuntimeId = string;

/**
 * SEED-RT Service
 * Manages multiple runtime instances
 */
export class SEEDRTService {
  private runtimes: Map<RuntimeId, SEEDRuntime> = new Map();
  private nextRuntimeId: number = 1;

  /**
   * Create runtime instance
   */
  createRuntime(
    initialState?: WorldState,
    config?: any
  ): RuntimeId {
    const runtimeId = `runtime-${this.nextRuntimeId++}`;
    const state = initialState || UniverseForgeAdapter.createInitialWorldState(`universe-${Date.now()}`);
    
    const runtime = new SEEDRuntime(state, {
      mainlineNodeId: 'mainline-杜浩麟',
      ...config,
    });

    this.runtimes.set(runtimeId, runtime);
    return runtimeId;
  }

  /**
   * Start runtime
   */
  async startRuntime(runtimeId: RuntimeId): Promise<void> {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }
    await runtime.start();
  }

  /**
   * Stop runtime
   */
  stopRuntime(runtimeId: RuntimeId): void {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }
    runtime.stop();
  }

  /**
   * Execute one cycle
   */
  async executeCycle(runtimeId: RuntimeId): Promise<any> {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }
    return await runtime.executeCycle();
  }

  /**
   * Execute multiple cycles
   */
  async executeCycles(runtimeId: RuntimeId, count: number): Promise<any[]> {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }
    return await runtime.executeCycles(count);
  }

  /**
   * Get current state
   */
  getState(runtimeId: RuntimeId): WorldState {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }
    return runtime.getWorldState();
  }

  /**
   * Get timelines
   */
  getTimelines(runtimeId: RuntimeId): Timeline[] {
    const state = this.getState(runtimeId);
    return state.activeTimelines;
  }

  /**
   * Branch timeline
   */
  branchTimeline(
    runtimeId: RuntimeId,
    timelineId: string,
    nodeId: string
  ): Timeline | null {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }

    const timelineManager = runtime.getTimelineManager();
    return timelineManager.branchTimeline(timelineId, nodeId);
  }

  /**
   * Merge timelines
   */
  mergeTimelines(
    runtimeId: RuntimeId,
    timelineIds: string[],
    mergePoint: string
  ): Timeline | null {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }

    const timelineManager = runtime.getTimelineManager();
    return timelineManager.mergeTimelines(timelineIds, mergePoint);
  }

  /**
   * Collapse timeline
   */
  collapseTimeline(
    runtimeId: RuntimeId,
    timelineId: string,
    reason: string
  ): boolean {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }

    const timelineManager = runtime.getTimelineManager();
    return timelineManager.collapseTimeline(timelineId, reason);
  }

  /**
   * Get convergence status
   */
  getConvergence(runtimeId: RuntimeId): ConvergenceCheck {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }

    // Execute a cycle to get convergence check
    // In real implementation, this would be cached
    const state = runtime.getWorldState();
    
    // Calculate convergence from timelines
    const convergences = state.activeTimelines.map(t => t.convergenceScore);
    const globalConvergence = convergences.length > 0
      ? convergences.reduce((a, b) => a + b, 0) / convergences.length
      : 0;

    return {
      globalConvergence,
      timelineConvergences: new Map(
        state.activeTimelines.map(t => [t.timelineId, t.convergenceScore])
      ),
      mainlineAlignment: 1.0,
      requiresCorrection: globalConvergence < -0.3,
    };
  }

  /**
   * Delete runtime
   */
  deleteRuntime(runtimeId: RuntimeId): void {
    const runtime = this.runtimes.get(runtimeId);
    if (runtime) {
      runtime.stop();
      this.runtimes.delete(runtimeId);
    }
  }

  /**
   * List all runtimes
   */
  listRuntimes(): RuntimeId[] {
    return Array.from(this.runtimes.keys());
  }

  /**
   * Get runtime
   */
  getRuntime(runtimeId: RuntimeId): SEEDRuntime | null {
    return this.runtimes.get(runtimeId) || null;
  }
}

