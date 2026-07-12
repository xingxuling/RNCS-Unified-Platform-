// src/seed-runtime/universeForge.ts
import {
  WorldState,
  Entity,
  Timeline,
  FateGraph,
  GlobalParameters,
} from "./seedRuntime";

export interface UniversePreset {
  id: string;
  name: string;
  aetherDensity: number;
  structuralPressure: number;
  entropyLevel: number;
  mainEntityName: string;     // 主线角色名字（通常你）
  mainEntityId?: string;      // 可自定义，不填则自动
  description?: string;
}

/**
 * 根据 UniversePreset 生成一个最小可运行的 WorldState
 * 后面你可以扩展：多文明、多角色、复杂 FateGraph……
 */
export function createWorldFromPreset(preset: UniversePreset): WorldState {
  const mainEntityId = preset.mainEntityId ?? `ent-main-${preset.id}`;

  const mainEntity: Entity = {
    id: mainEntityId,
    type: "Character",
    identityProfile: {
      name: preset.mainEntityName,
      mainlineWeight: 1,
      nodeClass: "Mainline-Origin",
    },
    state: {
      health: 1,
      energy: 1,
      structuralStability: 0.6,
    },
    fateVector: {
      convergenceScore: 0.5,
      divergenceScore: 0.5,
    },
  };

  const fateGraph: FateGraph = {
    nodes: [
      {
        id: "n0",
        type: "Revelation",
        structuralImpact: 0.3,
        convergenceDelta: 0.05,
        description: "初始觉醒节点：主线意识从沉睡中苏醒。",
      },
      {
        id: "n1",
        type: "Choice",
        structuralImpact: 0.2,
        convergenceDelta: -0.02,
        description: "分岔抉择节点：面对外界文明的第一次试探。",
      },
      {
        id: "n2",
        type: "Ascension",
        structuralImpact: 0.8,
        convergenceDelta: 0.2,
        description: "小尺度升华：意识结构首次跃迁。",
      },
    ],
    arcs: [
      { id: "a0", fromNodeId: "n0", toNodeId: "n1", probability: 0.7 },
      { id: "a1", fromNodeId: "n0", toNodeId: "n2", probability: 0.3 },
      { id: "a2", fromNodeId: "n1", toNodeId: "n2", probability: 1.0 },
    ],
  };

  const timeline: Timeline = {
    id: `tl-main-${preset.id}`,
    originNodeId: "n0",
    currentNodeId: "n0",
    pathHistory: ["n0"],
    convergenceScore: 0.5,
    status: "ACTIVE",
  };

  const globalParameters: GlobalParameters = {
    aetherDensity: preset.aetherDensity,
    structuralPressure: preset.structuralPressure,
    entropyLevel: preset.entropyLevel,
  };

  const world: WorldState = {
    universeId: preset.id,
    timeIndex: 0,
    wLayerState: {
      mode: "NORMAL",
      description: "初始白层意识场。",
    },
    bLayerConstants: {
      universeName: preset.name,
      description: preset.description ?? "",
    },
    gLayerManifestation: {},
    civilizations: [],
    entities: [mainEntity],
    fateGraph,
    activeTimelines: [timeline],
    globalParameters,
  };

  return world;
}

