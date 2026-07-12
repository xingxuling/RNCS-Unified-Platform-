// THE SEED v2.0 - SEED-RT v1 Public API
// Export all SEED-RT components

import { SEEDRuntime } from './SEEDRuntime';
import type { WorldState, RuntimeConfig } from './types';

export { SEEDRuntime } from './SEEDRuntime';
export { WorldStateManager } from './WorldStateManager';
export { RuntimeLoop } from './RuntimeLoop';
export { TimelineManager } from './TimelineManager';

// Export types
export type {
  WorldState,
  Entity,
  Timeline,
  FateGraph,
  FateNode,
  FateArc,
  Event,
  Civilization,
  GlobalParameters,
  RuntimeConfig,
  CycleResult,
  TerminationCondition,
  SenseResult,
  StructureResult,
  ProjectResult,
  ConvergenceCheck,
} from './types';

// Create default runtime instance helper
export function createSEEDRuntime(
  initialState: WorldState,
  config?: Partial<RuntimeConfig>
): SEEDRuntime {
  return new SEEDRuntime(initialState, config);
}

