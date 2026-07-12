// THE SEED v2.0 - SEED-RT v1 Runtime Loop
// Implements the Sense → Structure → Project cycle

import { WorldStateManager } from './WorldStateManager';
import {
  WorldState,
  CycleResult,
  SenseResult,
  StructureResult,
  ProjectResult,
  ConvergenceCheck,
  RuntimeConfig,
  FateNode,
  Event,
  Timeline,
  RiskZone,
  TimelineOperation,
} from './types';
import { oseEngine } from '../ose';

/**
 * Runtime Loop
 * Implements the SEED-RT cycle: Sense → Structure → Project
 */
export class RuntimeLoop {
  private worldStateManager: WorldStateManager;
  private config: RuntimeConfig;
  private cycleCount: number = 0;

  constructor(worldStateManager: WorldStateManager, config: RuntimeConfig) {
    this.worldStateManager = worldStateManager;
    this.config = config;
  }

  /**
   * Execute one cycle
   */
  async executeCycle(): Promise<CycleResult> {
    const startTime = Date.now();
    this.cycleCount++;

    // Step 1: Sense (White Layer)
    const senseResult = await this.sense();

    // Step 2: Structure (Blue Layer)
    const structureResult = await this.structure(senseResult);

    // Step 3: Project (Gold Layer)
    const projectResult = await this.project(structureResult);

    // Convergence check
    const convergenceCheck = this.checkConvergence();

    // Apply corrections if needed
    if (convergenceCheck.requiresCorrection && convergenceCheck.correctionEvents) {
      await this.applyCorrections(convergenceCheck.correctionEvents);
    }

    // Increment time
    this.worldStateManager.incrementTime();

    // Save snapshot
    this.worldStateManager.saveSnapshot();

    const endTime = Date.now();
    const cycleTime = endTime - startTime;

    // Check time limit
    if (cycleTime > this.config.cycleTimeLimit) {
      console.warn(`Cycle ${this.cycleCount} took ${cycleTime}ms, exceeding limit of ${this.config.cycleTimeLimit}ms`);
    }

    return {
      cycleNumber: this.cycleCount,
      timeIndex: this.worldStateManager.getState().timeIndex,
      senseResult,
      structureResult,
      projectResult,
      convergenceCheck,
      worldState: this.worldStateManager.getState(),
    };
  }

  /**
   * Step 1: Sense (White Layer)
   * Read current world state and assess risks
   */
  private async sense(): Promise<SenseResult> {
    const state = this.worldStateManager.getState();

    // Use OSE White Layer for awareness
    const whiteContext = {
      btosLevel: 4, // System-level awareness
      intentVector: [0.5, 0.5, 0.5],
      consciousnessState: 'active',
    };

    // Identify risk zones
    const riskZones = this.identifyRiskZones(state);

    // Find high-pressure fate nodes
    const highPressureNodes = this.findHighPressureNodes(state);

    // Get mainline node state
    const mainlineNode = this.worldStateManager.getEntity(this.config.mainlineNodeId);
    const mainlineNodeState = mainlineNode?.state || {
      structuralStability: 1.0,
    };

    // Calculate awareness level
    const awarenessLevel = this.calculateAwarenessLevel(state);

    return {
      riskZones,
      highPressureNodes,
      mainlineNodeState,
      awarenessLevel,
    };
  }

  /**
   * Step 2: Structure (Blue Layer)
   * Calculate structural changes and fate evolution
   */
  private async structure(senseResult: SenseResult): Promise<StructureResult> {
    const state = this.worldStateManager.getState();

    // Use OSE Blue Layer for structure analysis
    const blueStructure = {
      structureGraph: this.buildStructureGraph(state),
      causalityGraph: this.buildCausalityGraph(state),
    };

    // Calculate candidate fate nodes
    const candidateNodes = this.calculateCandidateNodes(state, senseResult);

    // Calculate timeline operations
    const timelineOperations = this.calculateTimelineOperations(state);

    // Assess structural stability
    const structuralStability = this.assessStructuralStability(state);

    // Calculate conflict intensity
    const conflictIntensity = this.calculateConflictIntensity(state);

    // Calculate ascension progress
    const ascensionProgress = this.calculateAscensionProgress(state);

    return {
      candidateNodes,
      timelineOperations,
      structuralStability,
      conflictIntensity,
      ascensionProgress,
    };
  }

  /**
   * Step 3: Project (Gold Layer)
   * Select events and update world state
   */
  private async project(structureResult: StructureResult): Promise<ProjectResult> {
    const state = this.worldStateManager.getState();

    // Use OSE Gold Layer for projection
    const goldExecution = {
      nextAction: this.selectNextAction(structureResult),
      threeStepPath: this.calculateThreeStepPath(structureResult),
      longlinePath: this.calculateLonglinePath(structureResult),
    };

    // Select events
    const selectedEvents = this.selectEvents(structureResult);

    // Apply timeline operations
    const timelineUpdates = this.applyTimelineOperations(structureResult.timelineOperations);

    // Update entities
    const updatedEntities = this.updateEntities(selectedEvents);

    // Apply structural changes
    const structuralChanges = this.applyStructuralChanges(selectedEvents);

    return {
      selectedEvents,
      updatedEntities,
      timelineUpdates,
      structuralChanges,
    };
  }

  /**
   * Check convergence with mainline node
   */
  private checkConvergence(): ConvergenceCheck {
    const state = this.worldStateManager.getState();
    const timelineConvergences = new Map<string, number>();

    // Calculate convergence for each timeline
    for (const timeline of state.activeTimelines) {
      timelineConvergences.set(timeline.timelineId, timeline.convergenceScore);
    }

    // Calculate global convergence
    const convergenceValues = Array.from(timelineConvergences.values());
    const globalConvergence = convergenceValues.length > 0
      ? convergenceValues.reduce((a, b) => a + b, 0) / convergenceValues.length
      : 0;

    // Check mainline alignment
    const mainlineNode = this.worldStateManager.getEntity(this.config.mainlineNodeId);
    const mainlineAlignment = mainlineNode?.fateVector.convergenceScore || 1.0;

    // Determine if correction is needed
    const requiresCorrection = globalConvergence < -0.3 || mainlineAlignment < 0.5;

    // Generate correction events if needed
    let correctionEvents: Event[] | undefined;
    if (requiresCorrection) {
      correctionEvents = this.generateCorrectionEvents(globalConvergence, mainlineAlignment);
    }

    return {
      globalConvergence,
      timelineConvergences,
      mainlineAlignment,
      requiresCorrection,
      correctionEvents,
    };
  }

  /**
   * Apply correction events
   */
  private async applyCorrections(events: Event[]): Promise<void> {
    for (const event of events) {
      await this.applyEvent(event);
    }
  }

  /**
   * Apply event to world state
   */
  private async applyEvent(event: Event): Promise<void> {
    const state = this.worldStateManager.getState();

    // Apply structural effects
    if (event.structuralEffect.worldStateChanges) {
      this.worldStateManager.updateState(event.structuralEffect.worldStateChanges);
    }

    // Apply entity state changes
    for (const [entityId, changes] of event.structuralEffect.entityStateChanges) {
      this.worldStateManager.updateEntity(entityId, { state: changes as any });
    }

    // Apply fate impact
    if (event.fateImpact.newNodes) {
      for (const node of event.fateImpact.newNodes) {
        this.worldStateManager.addFateNode(node);
      }
    }

    if (event.fateImpact.modifiedArcs) {
      for (const arc of event.fateImpact.modifiedArcs) {
        this.worldStateManager.addFateArc(arc);
      }
    }

    // Apply timeline effects
    if (event.timelineEffect) {
      if (event.timelineEffect.branch) {
        // Create new timeline
        const newTimeline: Timeline = {
          timelineId: event.timelineEffect.branch.newTimelineId,
          originNode: event.timelineEffect.branch.branchPoint,
          currentNode: event.timelineEffect.branch.branchPoint,
          pathHistory: [],
          convergenceScore: 0.5,
          status: 'Active',
          structuralState: {
            coherence: 0.7,
            density: 0.6,
            stability: 0.65,
          },
        };
        this.worldStateManager.addTimeline(newTimeline);
      }

      if (event.timelineEffect.merge) {
        // Merge timelines
        const timelinesToMerge = event.timelineEffect.merge.timelineIds
          .map(id => this.worldStateManager.getTimeline(id))
          .filter((t): t is Timeline => t !== null);

        if (timelinesToMerge.length > 1) {
          // Create merged timeline
          const mergedTimeline: Timeline = {
            timelineId: `merged-${Date.now()}`,
            originNode: timelinesToMerge[0].originNode,
            currentNode: event.timelineEffect.merge.mergePoint,
            pathHistory: [...timelinesToMerge[0].pathHistory],
            convergenceScore: Math.max(...timelinesToMerge.map(t => t.convergenceScore)) + 0.05,
            status: 'Active',
            structuralState: {
              coherence: 0.8,
              density: 0.7,
              stability: 0.75,
            },
          };

          // Remove old timelines
          for (const timeline of timelinesToMerge) {
            this.worldStateManager.removeTimeline(timeline.timelineId);
          }

          // Add merged timeline
          this.worldStateManager.addTimeline(mergedTimeline);
        }
      }

      if (event.timelineEffect.collapse) {
        // Collapse timeline
        const timeline = this.worldStateManager.getTimeline(event.timelineEffect.collapse.timelineId);
        if (timeline) {
          this.worldStateManager.updateTimeline(timeline.timelineId, {
            status: 'Collapsed',
          });
          // Remove from active timelines
          this.worldStateManager.removeTimeline(timeline.timelineId);
        }
      }
    }
  }

  // Helper methods

  private identifyRiskZones(state: WorldState): RiskZone[] {
    // Identify areas with high structural pressure or low stability
    const riskZones: RiskZone[] = [];

    // Check civilizations for conflicts
    for (const civ of state.civilizations) {
      if (civ.ascensionPath.currentPhase === 'Collapse') {
        riskZones.push({
          zoneId: `risk-civ-${civ.civId}`,
          location: { x: 0, y: 0, z: 0 }, // Placeholder
          riskLevel: 0.8,
          riskType: 'CivilizationCollapse',
        });
      }
    }

    // Check entities for low stability
    for (const entity of state.entities) {
      if (entity.state.structuralStability < 0.3) {
        riskZones.push({
          zoneId: `risk-entity-${entity.entityId}`,
          location: { x: 0, y: 0, z: 0 }, // Placeholder
          riskLevel: 1 - entity.state.structuralStability,
          riskType: 'EntityInstability',
        });
      }
    }

    return riskZones;
  }

  private findHighPressureNodes(state: WorldState): string[] {
    const highPressureNodes: string[] = [];

    for (const node of state.fateGraph.nodes.values()) {
      if (node.structuralImpact > 0.7) {
        highPressureNodes.push(node.nodeId);
      }
    }

    return highPressureNodes;
  }

  private calculateAwarenessLevel(state: WorldState): number {
    // Calculate based on consciousness density and awareness fields
    const whiteLayer = state.dimensionalLayers.white;
    const avgDensity = whiteLayer.consciousnessDensity;
    const fieldCount = whiteLayer.awarenessFields.length;
    
    return Math.min(1.0, avgDensity * (1 + fieldCount * 0.1));
  }

  private buildStructureGraph(state: WorldState): any {
    // Build structure graph from blue layer
    return {
      nodes: Array.from(state.fateGraph.nodes.values()),
      patterns: state.dimensionalLayers.blue.patternLibrary,
    };
  }

  private buildCausalityGraph(state: WorldState): any {
    // Build causality graph from fate arcs
    return {
      arcs: Array.from(state.fateGraph.arcs.values()),
      connections: state.dimensionalLayers.blue.systemArchitectures,
    };
  }

  private calculateCandidateNodes(state: WorldState, senseResult: SenseResult): FateNode[] {
    const candidateNodes: FateNode[] = [];

    // Get nodes reachable from current timeline nodes
    for (const timeline of state.activeTimelines) {
      const currentNode = this.worldStateManager.getFateNode(timeline.currentNode);
      if (currentNode) {
        // Find arcs from current node
        for (const arc of state.fateGraph.arcs.values()) {
          if (arc.fromNode === currentNode.nodeId) {
            const targetNode = this.worldStateManager.getFateNode(arc.toNode);
            if (targetNode && arc.probability > 0.1) {
              candidateNodes.push(targetNode);
            }
          }
        }
      }
    }

    // Remove duplicates
    const uniqueNodes = new Map<string, FateNode>();
    for (const node of candidateNodes) {
      uniqueNodes.set(node.nodeId, node);
    }

    return Array.from(uniqueNodes.values());
  }

  private calculateTimelineOperations(state: WorldState): TimelineOperation[] {
    const operations: TimelineOperation[] = [];

    for (const timeline of state.activeTimelines) {
      const currentNode = this.worldStateManager.getFateNode(timeline.currentNode);
      if (currentNode) {
        // Check for branch conditions
        if (currentNode.structuralImpact > 0.8 && currentNode.convergenceDelta < -0.2) {
          operations.push({
            type: 'Branch',
            timelineIds: [timeline.timelineId],
            targetNode: currentNode.nodeId,
            probability: 0.3,
          });
        }

        // Check for collapse conditions
        if (timeline.structuralState.coherence < 0.3 || timeline.convergenceScore < -0.5) {
          operations.push({
            type: 'Collapse',
            timelineIds: [timeline.timelineId],
          });
        }
      }
    }

    // Check for merge conditions
    const activeTimelines = state.activeTimelines.filter(t => t.status === 'Active');
    for (let i = 0; i < activeTimelines.length; i++) {
      for (let j = i + 1; j < activeTimelines.length; j++) {
        const t1 = activeTimelines[i];
        const t2 = activeTimelines[j];
        
        if (t1.currentNode === t2.currentNode &&
            t1.convergenceScore > 0.7 &&
            t2.convergenceScore > 0.7) {
          operations.push({
            type: 'Merge',
            timelineIds: [t1.timelineId, t2.timelineId],
            targetNode: t1.currentNode,
          });
        }
      }
    }

    return operations;
  }

  private assessStructuralStability(state: WorldState): number {
    // Calculate average structural stability
    const stabilities = state.entities.map(e => e.state.structuralStability);
    const avgStability = stabilities.length > 0
      ? stabilities.reduce((a, b) => a + b, 0) / stabilities.length
      : 1.0;

    // Factor in global parameters
    const pressureFactor = 1 - state.globalParameters.structuralPressure;
    
    return Math.min(1.0, avgStability * pressureFactor);
  }

  private calculateConflictIntensity(state: WorldState): number {
    // Calculate based on civilizations in conflict phases
    const conflictPhases: string[] = ['Saturation', 'Collapse'];
    const conflictCount = state.civilizations.filter(
      c => conflictPhases.includes(c.ascensionPath.currentPhase)
    ).length;

    return Math.min(1.0, conflictCount / state.civilizations.length);
  }

  private calculateAscensionProgress(state: WorldState): Map<string, number> {
    const progress = new Map<string, number>();

    for (const civ of state.civilizations) {
      const phaseProgress: Record<string, number> = {
        'Origin': 0.0,
        'Expansion': 0.25,
        'Saturation': 0.5,
        'Collapse': 0.75,
        'Ascension': 1.0,
      };

      const baseProgress = phaseProgress[civ.ascensionPath.currentPhase] || 0;
      const conditionProgress = civ.ascensionPath.conditions.reduce(
        (sum, c) => sum + c.currentProgress, 0
      ) / civ.ascensionPath.conditions.length;

      progress.set(civ.civId, (baseProgress + conditionProgress) / 2);
    }

    return progress;
  }

  private selectNextAction(structureResult: StructureResult): string {
    // Select highest priority action based on structure analysis
    if (structureResult.structuralStability < 0.3) {
      return 'StabilizeStructure';
    }
    if (structureResult.conflictIntensity > 0.7) {
      return 'ResolveConflict';
    }
    if (structureResult.candidateNodes.length > 0) {
      return 'AdvanceFate';
    }
    return 'Maintain';
  }

  private calculateThreeStepPath(structureResult: StructureResult): string[] {
    // Calculate three-step path based on candidate nodes
    const path: string[] = [];
    
    if (structureResult.candidateNodes.length >= 3) {
      path.push(
        structureResult.candidateNodes[0].nodeId,
        structureResult.candidateNodes[1].nodeId,
        structureResult.candidateNodes[2].nodeId
      );
    }

    return path;
  }

  private calculateLonglinePath(structureResult: StructureResult): string[] {
    // Calculate long-term path
    return structureResult.candidateNodes
      .slice(0, 10)
      .map(n => n.nodeId);
  }

  private selectEvents(structureResult: StructureResult): Event[] {
    const events: Event[] = [];

    // Select events based on candidate nodes
    for (const node of structureResult.candidateNodes.slice(0, 3)) {
      if (node.structuralImpact > 0.5) {
        events.push(this.createEventFromNode(node));
      }
    }

    return events;
  }

  private createEventFromNode(node: FateNode): Event {
    return {
      eventId: `event-${node.nodeId}-${Date.now()}`,
      triggerCondition: {
        type: 'FateNode',
        condition: { nodeId: node.nodeId },
      },
      structuralEffect: {
        worldStateChanges: {},
        entityStateChanges: new Map(),
        structuralModifications: [],
      },
      entitiesInvolved: [],
      fateImpact: {
        affectedNodes: [node.nodeId],
        convergenceChange: node.convergenceDelta,
      },
      eventType: this.mapNodeTypeToEventType(node.nodeType),
    };
  }

  private mapNodeTypeToEventType(nodeType: FateNode['nodeType']): Event['eventType'] {
    const mapping: Record<FateNode['nodeType'], Event['eventType']> = {
      'Choice': 'TurningPoint',
      'Encounter': 'Conflict',
      'Crisis': 'Collapse',
      'Revelation': 'Revelation',
      'Ascension': 'AscensionTrigger',
      'Collapse': 'Collapse',
    };
    return mapping[nodeType] || 'TurningPoint';
  }

  private applyTimelineOperations(operations: TimelineOperation[]): import('./types').TimelineUpdate[] {
    const updates: import('./types').TimelineUpdate[] = [];

    for (const op of operations) {
      if (op.type === 'Branch') {
        // Branch handled in applyEvent
      } else if (op.type === 'Merge') {
        // Merge handled in applyEvent
      } else if (op.type === 'Collapse') {
        for (const timelineId of op.timelineIds) {
          const timeline = this.worldStateManager.getTimeline(timelineId);
          if (timeline) {
            this.worldStateManager.updateTimeline(timelineId, {
              status: 'Collapsed',
            });
            updates.push({
              timelineId,
              updates: { status: 'Collapsed' },
            });
          }
        }
      }
    }

    return updates;
  }

  private updateEntities(events: Event[]): string[] {
    const updated: string[] = [];

    for (const event of events) {
      for (const entityId of event.entitiesInvolved) {
        const entity = this.worldStateManager.getEntity(entityId);
        if (entity) {
          // Apply fate impact
          const newConvergence = Math.max(-1, Math.min(1,
            entity.fateVector.convergenceScore + event.fateImpact.convergenceChange
          ));
          
          this.worldStateManager.updateEntity(entityId, {
            fateVector: {
              ...entity.fateVector,
              convergenceScore: newConvergence,
            },
          });

          updated.push(entityId);
        }
      }
    }

    return updated;
  }

  private applyStructuralChanges(events: Event[]): import('./types').StructuralModification[] {
    const allChanges: import('./types').StructuralModification[] = [];

    for (const event of events) {
      allChanges.push(...event.structuralEffect.structuralModifications);
    }

    return allChanges;
  }

  private generateCorrectionEvents(
    globalConvergence: number,
    mainlineAlignment: number
  ): Event[] {
    const events: Event[] = [];

    // Generate structural reorganization event
    if (globalConvergence < -0.3) {
      events.push({
        eventId: `correction-structural-${Date.now()}`,
        triggerCondition: {
          type: 'State',
          condition: { convergence: globalConvergence },
        },
        structuralEffect: {
          worldStateChanges: {
            globalParameters: {
              aetherDensity: 0.8,
              structuralPressure: 0.5,
            } as any,
          },
          entityStateChanges: new Map(),
          structuralModifications: [{
            type: 'DensityChange',
            target: 'global',
            value: 0.1,
          }],
        },
        entitiesInvolved: [this.config.mainlineNodeId],
        fateImpact: {
          affectedNodes: [],
          convergenceChange: 0.2,
        },
        eventType: 'Revelation',
      });
    }

    // Generate consciousness breakthrough event
    if (mainlineAlignment < 0.5) {
      events.push({
        eventId: `correction-consciousness-${Date.now()}`,
        triggerCondition: {
          type: 'State',
          condition: { alignment: mainlineAlignment },
        },
        structuralEffect: {
          worldStateChanges: {},
          entityStateChanges: new Map([
            [this.config.mainlineNodeId, {
              structuralStability: 0.9,
            } as any],
          ]),
          structuralModifications: [],
        },
        entitiesInvolved: [this.config.mainlineNodeId],
        fateImpact: {
          affectedNodes: [],
          convergenceChange: 0.3,
        },
        eventType: 'AscensionTrigger',
      });
    }

    return events;
  }

  /**
   * Get cycle count
   */
  getCycleCount(): number {
    return this.cycleCount;
  }
}

