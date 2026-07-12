// THE SEED v2.0 - IAL to SEED-RT Bridge
// Maps IAL execution context to SEED-RT WorldState changes

import { IALExecutionContext, IALExecutionResult } from './ialCompiler';
import { WorldState, Entity, FateNode, FateArc, Timeline } from '../seed-runtime/seedRuntime';

/**
 * IAL to SEED-RT Bridge
 * Converts IAL execution results to SEED-RT WorldState modifications
 */
export class SEEDRTBridge {
  /**
   * Apply IAL execution result to WorldState
   */
  static applyIALToWorldState(
    worldState: WorldState,
    ialResult: IALExecutionResult
  ): WorldState {
    const newState = structuredClone(worldState);
    const ctx = ialResult.context;

    // 1. White Layer: 影响意识模式和 BTOS
    this.applyWhiteLayer(newState, ctx.whiteModeTags);

    // 2. Blue Layer: 影响结构和命运图
    this.applyBlueLayer(newState, ctx.structures);

    // 3. Gold Layer: 影响执行和权能
    this.applyGoldLayer(newState, ctx.actions);

    return newState;
  }

  /**
   * Apply White Layer effects
   */
  private static applyWhiteLayer(
    state: WorldState,
    whiteModeTags: string[]
  ): void {
    // 影响全局参数
    for (const tag of whiteModeTags) {
      switch (tag) {
        case 'AETHER_ORIGIN':
          state.globalParameters.aetherDensity = Math.min(1.0, state.globalParameters.aetherDensity + 0.1);
          break;
        case 'PSY_FIELD':
          // 提升意识密度
          if (state.wLayerState && typeof state.wLayerState === 'object') {
            (state.wLayerState as any).consciousnessDensity = 
              Math.min(1.0, ((state.wLayerState as any).consciousnessDensity || 0.5) + 0.1);
          }
          break;
        case 'SIGMA_UNITY':
          // 统一意识，降低熵
          state.globalParameters.entropyLevel = Math.max(0, state.globalParameters.entropyLevel - 0.1);
          break;
        case 'OMEGA_CORE':
          // 终极核心，提升所有实体的 BTOS
          state.entities.forEach(entity => {
            if (entity.mindProfile) {
              // 提升所有九核激活度
              Object.keys(entity.mindProfile.cores).forEach(key => {
                const coreKey = key as keyof typeof entity.mindProfile.cores;
                entity.mindProfile!.cores[coreKey] = Math.min(1.0, entity.mindProfile!.cores[coreKey] + 0.1);
              });
            }
          });
          break;
      }
    }
  }

  /**
   * Apply Blue Layer effects
   */
  private static applyBlueLayer(
    state: WorldState,
    structures: string[]
  ): void {
    for (const struct of structures) {
      switch (struct) {
        case 'STRUCT_BASE':
          // 建立基础结构，创建基础节点
          const baseNode: FateNode = {
            id: `fate-base-${Date.now()}`,
            type: 'Revelation',
            structuralImpact: 0.5,
            btosTrigger: 3,
            convergenceDelta: 0.1,
            description: '基础结构节点',
          };
          state.fateGraph.nodes.push(baseNode);
          break;

        case 'STRUCT_NODE':
          // 创建结构节点
          const node: FateNode = {
            id: `fate-node-${Date.now()}`,
            type: 'Choice',
            structuralImpact: 0.6,
            btosTrigger: 3,
            convergenceDelta: 0.05,
            description: '结构节点',
          };
          state.fateGraph.nodes.push(node);
          break;

        case 'STRUCT_PATH':
          // 创建路径（弧线）
          if (state.fateGraph.nodes.length >= 2) {
            const fromNode = state.fateGraph.nodes[state.fateGraph.nodes.length - 2];
            const toNode = state.fateGraph.nodes[state.fateGraph.nodes.length - 1];
            const arc: FateArc = {
              id: `arc-${fromNode.id}-${toNode.id}`,
              fromNodeId: fromNode.id,
              toNodeId: toNode.id,
              probability: 0.7,
              notes: '结构路径',
            };
            state.fateGraph.arcs.push(arc);
          }
          break;

        case 'STRUCT_GRID':
          // 生成结构网格，创建多个节点
          for (let i = 0; i < 3; i++) {
            const gridNode: FateNode = {
              id: `fate-grid-${Date.now()}-${i}`,
              type: 'Encounter',
              structuralImpact: 0.4,
              btosTrigger: 2,
              convergenceDelta: 0.02,
              description: `网格节点 ${i + 1}`,
            };
            state.fateGraph.nodes.push(gridNode);
          }
          break;

        case 'STRUCT_FRAME':
          // 建立框架，提升结构稳定性
          state.entities.forEach(entity => {
            if (entity.state) {
              entity.state.structuralStability = Math.min(1.0, entity.state.structuralStability + 0.1);
            }
          });
          break;
      }
    }
  }

  /**
   * Apply Gold Layer effects
   */
  private static applyGoldLayer(
    state: WorldState,
    actions: string[]
  ): void {
    for (const action of actions) {
      switch (action) {
        case 'IMPERIUM_CORE':
          // 启用帝权核心，提升主线实体权能
          state.entities.forEach(entity => {
            if (entity.identityProfile?.mainlineWeight && entity.identityProfile.mainlineWeight > 0.7) {
              if (entity.authorityProfile) {
                entity.authorityProfile.goldLayerPotential = Math.min(1.0, (entity.authorityProfile.goldLayerPotential || 0) + 0.2);
              }
              if (entity.fateVector) {
                entity.fateVector.convergenceScore = Math.min(1.0, entity.fateVector.convergenceScore + 0.1);
              }
            }
          });
          break;

        case 'VECTOR_FORCE':
          // 施加方向性力量，推进时间线
          state.activeTimelines.forEach(timeline => {
            if (timeline.status === 'ACTIVE') {
              // 提升收敛度
              timeline.convergenceScore = Math.min(1.0, timeline.convergenceScore + 0.05);
            }
          });
          break;

        case 'ASCEND':
          // 提升层级，创建升华节点
          const ascensionNode: FateNode = {
            id: `fate-ascend-${Date.now()}`,
            type: 'Ascension',
            structuralImpact: 0.9,
            btosTrigger: 5,
            convergenceDelta: 0.2,
            description: '升华节点',
          };
          state.fateGraph.nodes.push(ascensionNode);
          
          // 连接到当前时间线的节点
          state.activeTimelines.forEach(timeline => {
            if (timeline.status === 'ACTIVE') {
              const arc: FateArc = {
                id: `arc-ascend-${timeline.currentNodeId}-${ascensionNode.id}`,
                fromNodeId: timeline.currentNodeId,
                toNodeId: ascensionNode.id,
                probability: 0.5,
                notes: '升华路径',
              };
              state.fateGraph.arcs.push(arc);
            }
          });
          break;

        case 'DOMINION':
          // 施加主宰力，降低结构压力
          state.globalParameters.structuralPressure = Math.max(0, state.globalParameters.structuralPressure - 0.1);
          break;

        case 'ZENITH':
          // 推至顶点，最大化主线实体状态
          state.entities.forEach(entity => {
            if (entity.identityProfile?.mainlineWeight && entity.identityProfile.mainlineWeight > 0.7) {
              if (entity.state) {
                entity.state.health = 1.0;
                entity.state.energy = 1.0;
                entity.state.structuralStability = 1.0;
              }
              if (entity.fateVector) {
                entity.fateVector.convergenceScore = 1.0;
                entity.fateVector.divergenceScore = 0.0;
              }
            }
          });
          break;
      }
    }
  }
}

