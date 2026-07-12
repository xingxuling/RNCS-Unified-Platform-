// THE SEED v2.0 - OSE Module
// Omni-Structure Engine - Public API

export { OSECore } from './Core';
export type { OSEState, WhiteContext, BlueStructure, GoldExecution } from './Core';
export { NineCoreSystem } from './NineCore';
export type { CoreType, CoreState } from './NineCore';
export { FateConvergenceModel } from './FateConvergence';
export type { MainlineNode, FateProjection } from './FateConvergence';
export { StructureJumpEngine } from './StructureJump';
export type { StructureGraph, StructureJump } from './StructureJump';

/**
 * OSE Engine (Integrated)
 * Complete OSE system with all components
 */
import { OSECore } from './Core';
import { NineCoreSystem } from './NineCore';
import { FateConvergenceModel } from './FateConvergence';
import { StructureJumpEngine, StructureGraph } from './StructureJump';
import { OSEExecutionCache } from './ExecutionCache';
import { CompiledIAL } from '@taowind/ial-compiler';

export class OSEEngine {
  private core: OSECore;
  private nineCore: NineCoreSystem;
  private fateModel: FateConvergenceModel;
  private jumpEngine: StructureJumpEngine;
  private executionCache: OSEExecutionCache;

  constructor() {
    this.core = new OSECore();
    this.nineCore = new NineCoreSystem();
    this.fateModel = new FateConvergenceModel();
    this.jumpEngine = new StructureJumpEngine();
    this.executionCache = new OSEExecutionCache();
  }

  /**
   * Execute IAL with full OSE processing
   */
  execute(compiled: CompiledIAL, useCache: boolean = true) {
    // Check cache
    if (useCache) {
      const cached = this.executionCache.get(compiled);
      if (cached) {
        return {
          ...cached.result,
          state: cached.state,
          cached: true,
        };
      }
    }

    // 1. Execute in OSE Core
    const state = this.core.execute(compiled);

    // 2. Process through Nine-Core system
    const coreResults = this.nineCore.process(compiled, state);

    // 3. Update fate convergence
    this.fateModel.updateMainlineConvergence(state);

    // 4. Check for structure jump opportunities
    const graph = this.jumpEngine.stateToGraph(state);
    const shouldJump = this.shouldPerformJump(graph);

    const result = {
      state,
      coreResults,
      fateConvergence: this.fateModel.calculateConvergence(state),
      structureJump: shouldJump ? this.jumpEngine.jump(graph, graph.level + 1) : null,
      cached: false,
    };

    // Cache result
    if (useCache) {
      this.executionCache.set(compiled, result, state);
    }

    return result;
  }

  /**
   * Check if structure jump should be performed
   */
  private shouldPerformJump(graph: StructureGraph): boolean {
    // Jump if complexity is high and coherence is good
    return graph.complexity > 0.7 && graph.coherence > 0.6;
  }

  /**
   * Get current state
   */
  getState() {
    return this.core.getState();
  }

  /**
   * Get core results
   */
  getCoreResults() {
    return this.nineCore.getCoreStates();
  }

  /**
   * Get fate convergence
   */
  getFateConvergence() {
    return this.fateModel.calculateConvergence(this.core.getState());
  }

  /**
   * Reset OSE
   */
  reset() {
    this.core.reset();
  }
}

/**
 * Global OSE instance
 */
export const oseEngine = new OSEEngine();

