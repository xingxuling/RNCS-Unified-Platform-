// THE SEED v2.0 - SEED-RT v1 Timeline Manager
// Manages timeline operations: branch, merge, collapse, seal

import {
  Timeline,
  FateNode,
  TimelineOperation,
  TimelineStatus,
  StructuralState,
} from './types';
import { WorldStateManager } from './WorldStateManager';

/**
 * Timeline Manager
 * Handles all timeline operations
 */
export class TimelineManager {
  private worldStateManager: WorldStateManager;
  private branchThreshold: number = 0.8;
  private mergeThreshold: number = 0.7;
  private collapseThreshold: number = 0.3;

  constructor(worldStateManager: WorldStateManager) {
    this.worldStateManager = worldStateManager;
  }

  /**
   * Branch timeline
   * Create new timeline from high-pressure node
   */
  branchTimeline(
    sourceTimelineId: string,
    branchPoint: string, // FateNode ID
    probability: number = 0.3
  ): Timeline | null {
    const sourceTimeline = this.worldStateManager.getTimeline(sourceTimelineId);
    if (!sourceTimeline) {
      return null;
    }

    const branchNode = this.worldStateManager.getFateNode(branchPoint);
    if (!branchNode) {
      return null;
    }

    // Check branch conditions
    if (branchNode.structuralImpact < this.branchThreshold) {
      return null;
    }

    // Create new timeline
    const newTimeline: Timeline = {
      timelineId: `timeline-branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originNode: branchPoint,
      currentNode: branchPoint,
      pathHistory: [...sourceTimeline.pathHistory, branchPoint],
      convergenceScore: Math.max(0, sourceTimeline.convergenceScore - 0.1),
      status: 'Active',
      structuralState: {
        coherence: sourceTimeline.structuralState.coherence * 0.9,
        density: sourceTimeline.structuralState.density * 0.9,
        stability: sourceTimeline.structuralState.stability * 0.85,
      },
    };

    this.worldStateManager.addTimeline(newTimeline);

    return newTimeline;
  }

  /**
   * Merge timelines
   * Combine timelines that reach same structural state
   */
  mergeTimelines(
    timelineIds: string[],
    mergePoint: string // FateNode ID
  ): Timeline | null {
    if (timelineIds.length < 2) {
      return null;
    }

    const timelines = timelineIds
      .map(id => this.worldStateManager.getTimeline(id))
      .filter((t): t is Timeline => t !== null && t.status === 'Active');

    if (timelines.length < 2) {
      return null;
    }

    // Check merge conditions
    const allAtSameNode = timelines.every(t => t.currentNode === mergePoint);
    const allHighConvergence = timelines.every(t => t.convergenceScore >= this.mergeThreshold);
    const similarStructure = this.checkSimilarStructure(timelines);

    if (!allAtSameNode || !allHighConvergence || !similarStructure) {
      return null;
    }

    // Create merged timeline
    const mergedTimeline: Timeline = {
      timelineId: `timeline-merged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originNode: timelines[0].originNode,
      currentNode: mergePoint,
      pathHistory: this.mergePathHistory(timelines),
      convergenceScore: Math.min(1.0, Math.max(...timelines.map(t => t.convergenceScore)) + 0.05),
      status: 'Active',
      structuralState: {
        coherence: this.averageStructuralValue(timelines, 'coherence'),
        density: this.averageStructuralValue(timelines, 'density'),
        stability: this.averageStructuralValue(timelines, 'stability'),
      },
    };

    // Remove old timelines
    for (const timeline of timelines) {
      this.worldStateManager.updateTimeline(timeline.timelineId, {
        status: 'Merged',
      });
      this.worldStateManager.removeTimeline(timeline.timelineId);
    }

    // Add merged timeline
    this.worldStateManager.addTimeline(mergedTimeline);

    return mergedTimeline;
  }

  /**
   * Collapse timeline
   * Fold timeline that becomes structurally inconsistent
   */
  collapseTimeline(
    timelineId: string,
    reason: string
  ): boolean {
    const timeline = this.worldStateManager.getTimeline(timelineId);
    if (!timeline) {
      return false;
    }

    // Check collapse conditions
    const lowCoherence = timeline.structuralState.coherence < this.collapseThreshold;
    const lowConvergence = timeline.convergenceScore < -0.5;
    const hasContradiction = this.checkContradiction(timeline);

    if (!lowCoherence && !lowConvergence && !hasContradiction) {
      return false;
    }

    // Mark as collapsed
    this.worldStateManager.updateTimeline(timelineId, {
      status: 'Collapsed',
    });

    // Remove from active timelines
    this.worldStateManager.removeTimeline(timelineId);

    return true;
  }

  /**
   * Seal timeline
   * Hide timeline for future access
   */
  sealTimeline(
    timelineId: string,
    reason: string
  ): boolean {
    const timeline = this.worldStateManager.getTimeline(timelineId);
    if (!timeline) {
      return false;
    }

    // Mark as sealed
    this.worldStateManager.updateTimeline(timelineId, {
      status: 'Sealed',
    });

    // Keep in timeline list but mark as sealed
    return true;
  }

  /**
   * Unseal timeline
   * Restore sealed timeline
   */
  unsealTimeline(timelineId: string): boolean {
    const timeline = this.worldStateManager.getTimeline(timelineId);
    if (!timeline || timeline.status !== 'Sealed') {
      return false;
    }

    // Restore to active
    this.worldStateManager.updateTimeline(timelineId, {
      status: 'Active',
    });

    return true;
  }

  /**
   * Advance timeline
   * Move timeline to next fate node
   */
  advanceTimeline(
    timelineId: string,
    nextNodeId: string
  ): boolean {
    const timeline = this.worldStateManager.getTimeline(timelineId);
    if (!timeline || timeline.status !== 'Active') {
      return false;
    }

    const nextNode = this.worldStateManager.getFateNode(nextNodeId);
    if (!nextNode) {
      return false;
    }

    // Update timeline
    this.worldStateManager.updateTimeline(timelineId, {
      currentNode: nextNodeId,
      pathHistory: [...timeline.pathHistory, nextNodeId],
      convergenceScore: Math.max(-1, Math.min(1,
        timeline.convergenceScore + nextNode.convergenceDelta
      )),
      structuralState: {
        coherence: Math.max(0, Math.min(1,
          timeline.structuralState.coherence + (nextNode.structuralImpact - 0.5) * 0.1
        )),
        density: timeline.structuralState.density,
        stability: Math.max(0, Math.min(1,
          timeline.structuralState.stability + (nextNode.convergenceDelta > 0 ? 0.05 : -0.05)
        )),
      },
    });

    return true;
  }

  /**
   * Get timeline path
   */
  getTimelinePath(timelineId: string): FateNode[] | null {
    const timeline = this.worldStateManager.getTimeline(timelineId);
    if (!timeline) {
      return null;
    }

    const path: FateNode[] = [];

    // Add origin node
    const originNode = this.worldStateManager.getFateNode(timeline.originNode);
    if (originNode) {
      path.push(originNode);
    }

    // Add path history nodes
    for (const nodeId of timeline.pathHistory) {
      const node = this.worldStateManager.getFateNode(nodeId);
      if (node) {
        path.push(node);
      }
    }

    // Add current node
    const currentNode = this.worldStateManager.getFateNode(timeline.currentNode);
    if (currentNode && currentNode.nodeId !== timeline.originNode) {
      path.push(currentNode);
    }

    return path;
  }

  /**
   * Calculate timeline convergence
   */
  calculateTimelineConvergence(timelineId: string): number {
    const timeline = this.worldStateManager.getTimeline(timelineId);
    if (!timeline) {
      return 0;
    }

    // Base convergence from timeline
    let convergence = timeline.convergenceScore;

    // Factor in structural stability
    convergence *= timeline.structuralState.stability;

    // Factor in path length (longer paths may diverge more)
    const pathLength = timeline.pathHistory.length;
    if (pathLength > 10) {
      convergence *= 0.95; // Slight penalty for very long paths
    }

    return Math.max(-1, Math.min(1, convergence));
  }

  // Helper methods

  private checkSimilarStructure(timelines: Timeline[]): boolean {
    if (timelines.length < 2) {
      return true;
    }

    const first = timelines[0].structuralState;
    const threshold = 0.1;

    return timelines.every(t => {
      const state = t.structuralState;
      return (
        Math.abs(state.coherence - first.coherence) < threshold &&
        Math.abs(state.density - first.density) < threshold &&
        Math.abs(state.stability - first.stability) < threshold
      );
    });
  }

  private mergePathHistory(timelines: Timeline[]): string[] {
    // Merge path histories, removing duplicates while preserving order
    const merged: string[] = [];
    const seen = new Set<string>();

    // Add origin nodes
    for (const timeline of timelines) {
      if (!seen.has(timeline.originNode)) {
        merged.push(timeline.originNode);
        seen.add(timeline.originNode);
      }
    }

    // Add path history nodes
    for (const timeline of timelines) {
      for (const nodeId of timeline.pathHistory) {
        if (!seen.has(nodeId)) {
          merged.push(nodeId);
          seen.add(nodeId);
        }
      }
    }

    return merged;
  }

  private averageStructuralValue(
    timelines: Timeline[],
    key: keyof StructuralState
  ): number {
    const sum = timelines.reduce((acc, t) => acc + t.structuralState[key], 0);
    return sum / timelines.length;
  }

  private checkContradiction(timeline: Timeline): boolean {
    // Check if timeline has logical contradictions
    // This is a simplified check - can be expanded
    
    // Check for repeated nodes in path (potential loops)
    const pathSet = new Set(timeline.pathHistory);
    if (pathSet.size < timeline.pathHistory.length) {
      return true; // Has loops
    }

    // Check for extreme convergence swings
    // This would require tracking convergence history
    // For now, just check current state
    if (timeline.convergenceScore < -0.8 && timeline.structuralState.coherence > 0.5) {
      return true; // Contradiction: low convergence but high coherence
    }

    return false;
  }
}

