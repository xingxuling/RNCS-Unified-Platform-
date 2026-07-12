// THE SEED v2.0 - SEED-RT v1 Universe-Forge Adapter
// Converts UniverseForge output to SEED-RT WorldState

import { GenerationResult } from '../forge/UniverseForge';
import { WorldState, Entity, Timeline, FateGraph, Civilization, FateNode, FateArc } from './types';
import { Universe } from '../v1/Universe';

/**
 * Universe-Forge Adapter
 * Converts UniverseForge generation results to SEED-RT WorldState
 */
export class UniverseForgeAdapter {
  /**
   * Convert GenerationResult to WorldState
   */
  static convertToWorldState(
    generationResult: GenerationResult,
    mainlineNodeId: string = 'mainline-杜浩麟'
  ): WorldState {
    const universe = generationResult.universe;
    const universeData = universe.getData();
    const exportedState = universe.exportState();
    // Create initial fate graph
    const fateGraph: FateGraph = {
      nodes: new Map(),
      arcs: new Map(),
      mainlineNodeId,
    };

    // Create mainline node
    const mainlineNode: FateNode = {
      nodeId: mainlineNodeId,
      nodeType: 'Ascension',
      structuralImpact: 1.0,
      btosTrigger: {
        whiteLayerImpact: 1.0,
        blueLayerImpact: 1.0,
        goldLayerImpact: 1.0,
      },
      convergenceDelta: 0,
      position: {
        fateSpaceCoordinates: { x: 0, y: 0, z: 0 },
        timelinePosition: 0,
        structuralDepth: 0,
      },
    };
    fateGraph.nodes.set(mainlineNodeId, mainlineNode);

    // Create initial timeline
    const initialTimeline: Timeline = {
      timelineId: `timeline-primary-${Date.now()}`,
      originNode: mainlineNodeId,
      currentNode: mainlineNodeId,
      pathHistory: [],
      convergenceScore: 1.0,
      status: 'Active',
      structuralState: {
        coherence: 1.0,
        density: 0.8,
        stability: 0.9,
      },
    };

    // Convert worlds to civilizations
    const civilizations: Civilization[] = [];
    const entities: Entity[] = [];

    // Add mainline entity
    const mainlineEntity: Entity = {
      entityId: mainlineNodeId,
      type: 'Character',
      identityProfile: {
        name: '杜浩麟',
        origin: 'Mainline Origin Node',
        nodeClass: 'Architect',
        mainlineLevel: 1.0,
      },
      mindProfile: {
        btosLevel: 5,
        nineCoreProfile: {
          control: 1.0,
          creative: 1.0,
          perceptual: 1.0,
          defensive: 1.0,
          metacognitive: 1.0,
          strategic: 1.0,
          exploratory: 1.0,
          emotionalHarmonic: 1.0,
          fateIntuition: 1.0,
        },
        structuralDensity: 1.0,
      },
      authorityProfile: {
        goldLayerCapacity: 1.0,
        authorityDomain: {
          domainId: 'mainline-domain',
          scope: ['global'],
          authorityLevel: 1.0,
        },
      },
      fateVector: {
        convergenceScore: 1.0,
        fatePath: [],
        criticalNodes: [],
      },
      state: {
        structuralStability: 1.0,
      },
    };
    entities.push(mainlineEntity);

    // Convert worlds to civilizations
    for (const world of exportedState.worlds || []) {
      const civ: Civilization = {
        civId: `civ-${world.id}`,
        name: world.name,
        originSeed: {
          type: 'StructuralSeed',
          structuralDensity: 0.7,
        },
        mindArchitecture: {
          btosLevel: 3,
          nineCoreProfile: {
            control: 0.7,
            creative: 0.6,
            perceptual: 0.8,
            defensive: 0.5,
            metacognitive: 0.6,
            strategic: 0.7,
            exploratory: 0.6,
            emotionalHarmonic: 0.5,
            fateIntuition: 0.6,
          },
          consciousnessDensity: 0.6,
        },
        politicalStructure: {
          authorityDistribution: {},
          governanceSystem: 'Democracy',
          powerHierarchy: {
            levels: [],
          },
        },
        technologyTree: {
          currentLevel: 'Information',
          availableTechs: [],
          researchDirections: [],
        },
        ascensionPath: {
          currentPhase: 'Expansion',
          nextPhase: 'Saturation',
          conditions: [],
          convergenceScore: 0.5,
        },
      };
      civilizations.push(civ);

      // Create civilization entity
      const civEntity: Entity = {
        entityId: civ.civId,
        type: 'Civilization',
        fateVector: {
          convergenceScore: 0.5,
          fatePath: [],
          criticalNodes: [],
        },
        state: {
          structuralStability: 0.7,
        },
      };
      entities.push(civEntity);
    }

    // Create world state
    const worldState: WorldState = {
      universeId: universeData.id,
      timeIndex: 0,
      dimensionalLayers: {
        white: {
          consciousnessDensity: 0.7,
          awarenessFields: [],
          identityNodes: [{
            nodeId: mainlineNodeId,
            identity: '杜浩麟',
            mainlineAlignment: 1.0,
            structuralDensity: 1.0,
          }],
        },
        blue: {
          structureDensity: 0.7,
          patternLibrary: [],
          systemArchitectures: [],
        },
        gold: {
          authorityZones: [],
          manifestationRegions: [],
          executionDomains: [],
        },
      },
      civilizations,
      entities,
      fateGraph,
      activeTimelines: [initialTimeline],
      globalParameters: {
        aetherDensity: 0.7,
        structuralPressure: 0.3,
        fateConvergenceRate: 0.5,
        identityPersistenceStrength: 0.9,
        structureJumpProbability: 0.1,
        memoryResonanceDecay: 0.05,
      },
    };

    return worldState;
  }

  /**
   * Create initial WorldState from scratch
   */
  static createInitialWorldState(
    universeId: string,
    mainlineNodeId: string = 'mainline-杜浩麟'
  ): WorldState {
    // Create mainline node
    const mainlineNode: FateNode = {
      nodeId: mainlineNodeId,
      nodeType: 'Ascension',
      structuralImpact: 1.0,
      btosTrigger: {
        whiteLayerImpact: 1.0,
        blueLayerImpact: 1.0,
        goldLayerImpact: 1.0,
      },
      convergenceDelta: 0,
      position: {
        fateSpaceCoordinates: { x: 0, y: 0, z: 0 },
        timelinePosition: 0,
        structuralDepth: 0,
      },
    };

    // Create fate graph
    const fateGraph: FateGraph = {
      nodes: new Map([[mainlineNodeId, mainlineNode]]),
      arcs: new Map(),
      mainlineNodeId,
    };

    // Create initial timeline
    const initialTimeline: Timeline = {
      timelineId: `timeline-primary-${Date.now()}`,
      originNode: mainlineNodeId,
      currentNode: mainlineNodeId,
      pathHistory: [],
      convergenceScore: 1.0,
      status: 'Active',
      structuralState: {
        coherence: 1.0,
        density: 0.8,
        stability: 0.9,
      },
    };

    // Create mainline entity
    const mainlineEntity: Entity = {
      entityId: mainlineNodeId,
      type: 'Character',
      identityProfile: {
        name: '杜浩麟',
        origin: 'Mainline Origin Node',
        nodeClass: 'Architect',
        mainlineLevel: 1.0,
      },
      mindProfile: {
        btosLevel: 5,
        nineCoreProfile: {
          control: 1.0,
          creative: 1.0,
          perceptual: 1.0,
          defensive: 1.0,
          metacognitive: 1.0,
          strategic: 1.0,
          exploratory: 1.0,
          emotionalHarmonic: 1.0,
          fateIntuition: 1.0,
        },
        structuralDensity: 1.0,
      },
      authorityProfile: {
        goldLayerCapacity: 1.0,
        authorityDomain: {
          domainId: 'mainline-domain',
          scope: ['global'],
          authorityLevel: 1.0,
        },
      },
      fateVector: {
        convergenceScore: 1.0,
        fatePath: [],
        criticalNodes: [],
      },
      state: {
        structuralStability: 1.0,
      },
    };

    return {
      universeId,
      timeIndex: 0,
      dimensionalLayers: {
        white: {
          consciousnessDensity: 0.7,
          awarenessFields: [],
          identityNodes: [{
            nodeId: mainlineNodeId,
            identity: '杜浩麟',
            mainlineAlignment: 1.0,
            structuralDensity: 1.0,
          }],
        },
        blue: {
          structureDensity: 0.7,
          patternLibrary: [],
          systemArchitectures: [],
        },
        gold: {
          authorityZones: [],
          manifestationRegions: [],
          executionDomains: [],
        },
      },
      civilizations: [],
      entities: [mainlineEntity],
      fateGraph,
      activeTimelines: [initialTimeline],
      globalParameters: {
        aetherDensity: 0.7,
        structuralPressure: 0.3,
        fateConvergenceRate: 0.5,
        identityPersistenceStrength: 0.9,
        structureJumpProbability: 0.1,
        memoryResonanceDecay: 0.05,
      },
    };
  }
}

