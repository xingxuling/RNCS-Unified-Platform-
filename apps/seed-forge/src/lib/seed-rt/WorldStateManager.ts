// THE SEED v2.0 - SEED-RT v1 World State Manager
// Manages world state and provides state operations

import {
  WorldState,
  Entity,
  Timeline,
  FateGraph,
  Civilization,
  GlobalParameters,
  DimensionalLayers,
} from './types';

/**
 * World State Manager
 * Manages the complete world state for SEED-RT
 */
export class WorldStateManager {
  private state: WorldState;
  private history: WorldState[] = [];
  private maxHistorySize: number = 100;

  constructor(initialState: WorldState) {
    this.state = this.deepClone(initialState);
    this.saveSnapshot();
  }

  /**
   * Get current world state
   */
  getState(): WorldState {
    return this.deepClone(this.state);
  }

  /**
   * Update world state
   */
  updateState(updates: Partial<WorldState>): void {
    this.state = {
      ...this.state,
      ...updates,
    };
  }

  /**
   * Increment time index
   */
  incrementTime(): void {
    this.state.timeIndex++;
  }

  /**
   * Get entity by ID
   */
  getEntity(entityId: string): Entity | null {
    return this.state.entities.find(e => e.entityId === entityId) || null;
  }

  /**
   * Add entity
   */
  addEntity(entity: Entity): void {
    this.state.entities.push(entity);
  }

  /**
   * Update entity
   */
  updateEntity(entityId: string, updates: Partial<Entity>): void {
    const index = this.state.entities.findIndex(e => e.entityId === entityId);
    if (index !== -1) {
      this.state.entities[index] = {
        ...this.state.entities[index],
        ...updates,
      };
    }
  }

  /**
   * Remove entity
   */
  removeEntity(entityId: string): void {
    this.state.entities = this.state.entities.filter(e => e.entityId !== entityId);
  }

  /**
   * Get timeline by ID
   */
  getTimeline(timelineId: string): Timeline | null {
    return this.state.activeTimelines.find(t => t.timelineId === timelineId) || null;
  }

  /**
   * Add timeline
   */
  addTimeline(timeline: Timeline): void {
    this.state.activeTimelines.push(timeline);
  }

  /**
   * Update timeline
   */
  updateTimeline(timelineId: string, updates: Partial<Timeline>): void {
    const index = this.state.activeTimelines.findIndex(t => t.timelineId === timelineId);
    if (index !== -1) {
      this.state.activeTimelines[index] = {
        ...this.state.activeTimelines[index],
        ...updates,
      };
    }
  }

  /**
   * Remove timeline
   */
  removeTimeline(timelineId: string): void {
    this.state.activeTimelines = this.state.activeTimelines.filter(t => t.timelineId !== timelineId);
  }

  /**
   * Get civilization by ID
   */
  getCivilization(civId: string): Civilization | null {
    return this.state.civilizations.find(c => c.civId === civId) || null;
  }

  /**
   * Add civilization
   */
  addCivilization(civilization: Civilization): void {
    this.state.civilizations.push(civilization);
  }

  /**
   * Update civilization
   */
  updateCivilization(civId: string, updates: Partial<Civilization>): void {
    const index = this.state.civilizations.findIndex(c => c.civId === civId);
    if (index !== -1) {
      this.state.civilizations[index] = {
        ...this.state.civilizations[index],
        ...updates,
      };
    }
  }

  /**
   * Get fate node by ID
   */
  getFateNode(nodeId: string): import('./types').FateNode | null {
    return this.state.fateGraph.nodes.get(nodeId) || null;
  }

  /**
   * Add fate node
   */
  addFateNode(node: import('./types').FateNode): void {
    this.state.fateGraph.nodes.set(node.nodeId, node);
  }

  /**
   * Update fate node
   */
  updateFateNode(nodeId: string, updates: Partial<import('./types').FateNode>): void {
    const node = this.state.fateGraph.nodes.get(nodeId);
    if (node) {
      this.state.fateGraph.nodes.set(nodeId, {
        ...node,
        ...updates,
      });
    }
  }

  /**
   * Get fate arc by ID
   */
  getFateArc(arcId: string): import('./types').FateArc | null {
    return this.state.fateGraph.arcs.get(arcId) || null;
  }

  /**
   * Add fate arc
   */
  addFateArc(arc: import('./types').FateArc): void {
    this.state.fateGraph.arcs.set(arc.arcId, arc);
  }

  /**
   * Update global parameters
   */
  updateGlobalParameters(updates: Partial<GlobalParameters>): void {
    this.state.globalParameters = {
      ...this.state.globalParameters,
      ...updates,
    };
  }

  /**
   * Save snapshot
   */
  saveSnapshot(): void {
    this.history.push(this.deepClone(this.state));
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Get snapshot at index
   */
  getSnapshot(index: number): WorldState | null {
    if (index >= 0 && index < this.history.length) {
      return this.deepClone(this.history[index]);
    }
    return null;
  }

  /**
   * Get latest snapshot
   */
  getLatestSnapshot(): WorldState | null {
    if (this.history.length > 0) {
      return this.deepClone(this.history[this.history.length - 1]);
    }
    return null;
  }

  /**
   * Rollback to snapshot
   */
  rollbackToSnapshot(index: number): boolean {
    const snapshot = this.getSnapshot(index);
    if (snapshot) {
      this.state = snapshot;
      // Remove snapshots after this index
      this.history = this.history.slice(0, index + 1);
      return true;
    }
    return false;
  }

  /**
   * Rollback to latest snapshot
   */
  rollbackToLatest(): boolean {
    const snapshot = this.getLatestSnapshot();
    if (snapshot) {
      this.state = snapshot;
      // Remove the last snapshot (current state)
      this.history.pop();
      return true;
    }
    return false;
  }

  /**
   * Deep clone
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Validate state consistency
   */
  validateConsistency(): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check mainline node exists
    const mainlineNode = this.state.fateGraph.nodes.get(this.state.fateGraph.mainlineNodeId);
    if (!mainlineNode) {
      errors.push(`Mainline node ${this.state.fateGraph.mainlineNodeId} not found`);
    }

    // Check timeline nodes exist
    for (const timeline of this.state.activeTimelines) {
      if (!this.state.fateGraph.nodes.has(timeline.originNode)) {
        errors.push(`Timeline ${timeline.timelineId} origin node ${timeline.originNode} not found`);
      }
      if (!this.state.fateGraph.nodes.has(timeline.currentNode)) {
        errors.push(`Timeline ${timeline.timelineId} current node ${timeline.currentNode} not found`);
      }
    }

    // Check fate arcs reference valid nodes
    for (const arc of this.state.fateGraph.arcs.values()) {
      if (!this.state.fateGraph.nodes.has(arc.fromNode)) {
        errors.push(`Fate arc ${arc.arcId} from node ${arc.fromNode} not found`);
      }
      if (!this.state.fateGraph.nodes.has(arc.toNode)) {
        errors.push(`Fate arc ${arc.arcId} to node ${arc.toNode} not found`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

