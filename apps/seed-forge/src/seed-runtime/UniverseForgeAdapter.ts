// THE SEED v2.0 - Universe-Forge to SEED-RT Adapter
// Converts Universe-Forge output to SEED-RT WorldState

import { GenerationResult } from '../lib/forge/UniverseForge';
import { WorldState, Entity, Timeline, FateGraph, FateNode, FateArc } from './seedRuntime';
import { Universe } from '../lib/v1/Universe';

/**
 * Universe-Forge Adapter
 * Converts Universe-Forge generation results to SEED-RT WorldState
 */
export class UniverseForgeAdapter {
  /**
   * Convert GenerationResult to WorldState
   */
  static convertToWorldState(
    generationResult: GenerationResult,
    mainlineNodeName: string = '杜浩麟'
  ): WorldState {
    const universe = generationResult.universe;
    const universeData = universe.getData();

    // Create initial fate graph
    const fateGraph: FateGraph = {
      nodes: [],
      arcs: [],
    };

    // Create mainline revelation node
    const mainlineNode: FateNode = {
      id: 'fate-mainline-origin',
      type: 'Revelation',
      structuralImpact: 1.0,
      btosTrigger: 5,
      convergenceDelta: 0,
      description: `主线起源节点：${mainlineNodeName}`,
    };
    fateGraph.nodes.push(mainlineNode);

    // Create initial choice node
    const choiceNode: FateNode = {
      id: 'fate-choice-1',
      type: 'Choice',
      structuralImpact: 0.5,
      btosTrigger: 3,
      convergenceDelta: 0.1,
      description: '初始选择节点',
    };
    fateGraph.nodes.push(choiceNode);

    // Create ascension node
    const ascensionNode: FateNode = {
      id: 'fate-ascension-1',
      type: 'Ascension',
      structuralImpact: 0.8,
      btosTrigger: 5,
      convergenceDelta: 0.2,
      description: '升华节点',
    };
    fateGraph.nodes.push(ascensionNode);

    // Create arcs
    fateGraph.arcs.push({
      id: 'arc-mainline-to-choice',
      fromNodeId: mainlineNode.id,
      toNodeId: choiceNode.id,
      probability: 0.7,
      notes: '主线到选择的路径',
    });

    fateGraph.arcs.push({
      id: 'arc-mainline-to-ascension',
      fromNodeId: mainlineNode.id,
      toNodeId: ascensionNode.id,
      probability: 0.3,
      notes: '主线到升华的路径',
    });

    fateGraph.arcs.push({
      id: 'arc-choice-to-ascension',
      fromNodeId: choiceNode.id,
      toNodeId: ascensionNode.id,
      probability: 1.0,
      notes: '选择到升华的路径',
    });

    // Create initial timeline
    const initialTimeline: Timeline = {
      id: `timeline-primary-${Date.now()}`,
      originNodeId: mainlineNode.id,
      currentNodeId: mainlineNode.id,
      pathHistory: [mainlineNode.id],
      convergenceScore: 1.0,
      status: 'ACTIVE',
    };

    // Convert worlds to civilizations
    const civilizations: Entity[] = [];
    const entities: Entity[] = [];

    // Add mainline entity
    const mainlineEntity: Entity = {
      id: 'entity-mainline',
      type: 'Character',
      identityProfile: {
        name: mainlineNodeName,
        nodeClass: 'Architect',
        mainlineWeight: 1.0,
      },
      mindProfile: {
        btosLevel: 5,
        cores: {
          control: 1.0,
          creative: 1.0,
          perceptual: 1.0,
          defensive: 1.0,
          metacog: 1.0,
          strategic: 1.0,
          exploratory: 1.0,
          emotional: 1.0,
          fateIntuition: 1.0,
        },
      },
      authorityProfile: {
        goldLayerPotential: 1.0,
        ialSignature: 'Ψ : Γ K Z : V',
      },
      fateVector: {
        convergenceScore: 1.0,
        divergenceScore: 0.0,
      },
      state: {
        health: 1.0,
        energy: 1.0,
        structuralStability: 1.0,
      },
    };
    entities.push(mainlineEntity);

    // Convert worlds to civilizations
    const worlds = (universeData as any).worlds || [];
    for (const world of worlds) {
      const civ: Entity = {
        id: `civ-${world.id}`,
        type: 'Civilization',
        identityProfile: {
          name: world.name,
          mainlineWeight: 0.5,
        },
        mindProfile: {
          btosLevel: 3,
          cores: {
            control: 0.7,
            creative: 0.6,
            perceptual: 0.8,
            defensive: 0.5,
            metacog: 0.6,
            strategic: 0.7,
            exploratory: 0.6,
            emotional: 0.5,
            fateIntuition: 0.6,
          },
        },
        fateVector: {
          convergenceScore: 0.5,
          divergenceScore: 0.5,
        },
        state: {
          health: 0.8,
          energy: 0.7,
          structuralStability: 0.7,
        },
      };
      civilizations.push(civ);
      entities.push(civ);
    }

    // Create world state
    const worldState: WorldState = {
      universeId: universeData.id,
      timeIndex: 0,
      wLayerState: {
        consciousnessDensity: 0.7,
      },
      bLayerConstants: {
        structureDensity: 0.7,
      },
      gLayerManifestation: {
        authorityZones: [],
      },
      civilizations,
      entities,
      fateGraph,
      activeTimelines: [initialTimeline],
      globalParameters: {
        aetherDensity: 0.7,
        structuralPressure: 0.3,
        entropyLevel: 0.2,
      },
    };

    return worldState;
  }

  /**
   * Create initial WorldState from scratch
   */
  static createInitialWorldState(
    universeId: string,
    mainlineNodeName: string = '杜浩麟'
  ): WorldState {
    // Create mainline node
    const mainlineNode: FateNode = {
      id: 'fate-mainline-origin',
      type: 'Revelation',
      structuralImpact: 1.0,
      btosTrigger: 5,
      convergenceDelta: 0,
      description: `主线起源节点：${mainlineNodeName}`,
    };

    // Create fate graph
    const fateGraph: FateGraph = {
      nodes: [mainlineNode],
      arcs: [],
    };

    // Create initial timeline
    const initialTimeline: Timeline = {
      id: `timeline-primary-${Date.now()}`,
      originNodeId: mainlineNode.id,
      currentNodeId: mainlineNode.id,
      pathHistory: [mainlineNode.id],
      convergenceScore: 1.0,
      status: 'ACTIVE',
    };

    // Create mainline entity
    const mainlineEntity: Entity = {
      id: 'entity-mainline',
      type: 'Character',
      identityProfile: {
        name: mainlineNodeName,
        nodeClass: 'Architect',
        mainlineWeight: 1.0,
      },
      mindProfile: {
        btosLevel: 5,
        cores: {
          control: 1.0,
          creative: 1.0,
          perceptual: 1.0,
          defensive: 1.0,
          metacog: 1.0,
          strategic: 1.0,
          exploratory: 1.0,
          emotional: 1.0,
          fateIntuition: 1.0,
        },
      },
      authorityProfile: {
        goldLayerPotential: 1.0,
        ialSignature: 'Ψ : Γ K Z : V',
      },
      fateVector: {
        convergenceScore: 1.0,
        divergenceScore: 0.0,
      },
      state: {
        health: 1.0,
        energy: 1.0,
        structuralStability: 1.0,
      },
    };

    return {
      universeId,
      timeIndex: 0,
      wLayerState: {},
      bLayerConstants: {},
      gLayerManifestation: {},
      civilizations: [],
      entities: [mainlineEntity],
      fateGraph,
      activeTimelines: [initialTimeline],
      globalParameters: {
        aetherDensity: 0.7,
        structuralPressure: 0.3,
        entropyLevel: 0.2,
      },
    };
  }
}

