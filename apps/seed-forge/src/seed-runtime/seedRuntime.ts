// src/seed-runtime/seedRuntime.ts

// =========================
// 基本类型定义
// =========================

export type WBGLayerState = "WHITE" | "BLUE" | "GOLD";

export type BTOSLevel = 1 | 2 | 3 | 4 | 5;

export interface GlobalParameters {
  aetherDensity: number;      // 以太密度
  structuralPressure: number; // 结构压力
  entropyLevel: number;       // 熵水平
}

export interface IdentityProfile {
  name: string;
  nodeClass?: string;     // Architect / Oracle / Warrior……
  mainlineWeight?: number; // 与主线的权重关系，用于收敛计算
}

export interface MindProfile {
  btosLevel: BTOSLevel;
  // 九核激活度（0–1）
  cores: {
    control: number;
    creative: number;
    perceptual: number;
    defensive: number;
    metacog: number;
    strategic: number;
    exploratory: number;
    emotional: number;
    fateIntuition: number;
  };
}

export interface AuthorityProfile {
  ialSignature?: string;     // 例如：Ψ : Γ K Z : V
  goldLayerPotential?: number; // 0–1，越高越接近帝级权能
}

export type EntityType = "Character" | "Civilization" | "Artifact" | "StructureNode";

export interface FateVector {
  convergenceScore: number;  // 与主线的收束度（0–1）
  divergenceScore: number;   // 与熵/偏离的程度（0–1）
}

export interface EntityState {
  health: number;            // 0–1
  energy: number;            // 0–1
  structuralStability: number; // 0–1
}

export interface Entity {
  id: string;
  type: EntityType;
  identityProfile?: IdentityProfile;
  mindProfile?: MindProfile;
  authorityProfile?: AuthorityProfile;
  fateVector?: FateVector;
  state?: EntityState;
}

// 命运节点 & 弧线

export type FateNodeType =
  | "Choice"
  | "Encounter"
  | "Crisis"
  | "Revelation"
  | "Ascension"
  | "Collapse";

export interface FateNode {
  id: string;
  type: FateNodeType;
  structuralImpact: number; // 对结构的影响 0–1
  btosTrigger?: BTOSLevel;  // 触发意识层级
  convergenceDelta: number; // 对收束度的影响（可以为负）
  description?: string;
}

export interface FateArc {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  probability: number;        // 0–1
  notes?: string;
}

export interface FateGraph {
  nodes: FateNode[];
  arcs: FateArc[];
}

// 事件

export interface Event {
  id: string;
  name: string;
  triggerNodeId?: string;
  structuralEffect: {
    globalDelta?: Partial<GlobalParameters>;
    entityDeltas?: Array<{
      entityId: string;
      stateDelta?: Partial<EntityState>;
      convergenceDelta?: number;
    }>;
  };
  timelineEffect?: {
    createBranchFromTimelineId?: string;
    mergeTimelineIds?: string[];
  };
  description?: string;
}

// 时间线

export type TimelineStatus = "ACTIVE" | "COLLAPSED" | "MERGED";

export interface Timeline {
  id: string;
  originNodeId: string;
  currentNodeId: string;
  pathHistory: string[]; // FateNode.id[]
  convergenceScore: number;
  status: TimelineStatus;
}

// 世界状态

export interface WorldState {
  universeId: string;
  timeIndex: number;
  wLayerState: any; // 可以以后细化为具体结构
  bLayerConstants: any;
  gLayerManifestation: any;
  civilizations: Entity[]; // type === "Civilization"
  entities: Entity[];
  fateGraph: FateGraph;
  activeTimelines: Timeline[];
  globalParameters: GlobalParameters;
}

// 运行结果

export interface RuntimeCycleResult {
  worldState: WorldState;
  triggeredEvents: Event[];
  debugInfo?: any;
}

// 运行时配置

export interface SEEDRuntimeConfig {
  mainlineOriginName: string;   // 例如 "杜浩麟"
  convergenceThreshold?: number; // 若收束度过低则触发校正事件
  maxTimelines?: number;        // 避免无限分支
}

// =========================
// 工具函数
// =========================

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function randomChoice<T>(list: T[]): T | undefined {
  if (list.length === 0) return undefined;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

function findFateNode(graph: FateGraph, id: string): FateNode | undefined {
  return graph.nodes.find((n) => n.id === id);
}

// 计算全局收束度 = 所有时间线收束度的加权平均
function computeGlobalConvergence(timelines: Timeline[]): number {
  if (timelines.length === 0) return 0;
  const active = timelines.filter((t) => t.status === "ACTIVE");
  if (active.length === 0) return 0;
  const sum = active.reduce((acc, t) => acc + t.convergenceScore, 0);
  return sum / active.length;
}

// =========================
// 运行时主体
// =========================

export class SEEDRuntime {
  private state: WorldState;
  private config: Required<SEEDRuntimeConfig>;
  private running = false;

  constructor(initialState: WorldState, config: SEEDRuntimeConfig) {
    this.state = structuredClone(initialState);
    this.config = {
      convergenceThreshold: 0.4,
      maxTimelines: 16,
      ...config,
    };
  }

  public getWorldState(): WorldState {
    return structuredClone(this.state);
  }

  // ✨ 新增：允许外部载入一个新的世界状态（比如 IAL 改完的）
  public loadWorldState(state: WorldState) {
    this.state = structuredClone(state);
  }

  public isRunning(): boolean {
    return this.running;
  }

  public start() {
    this.running = true;
  }

  public stop() {
    this.running = false;
  }

  // 执行一次循环：Sense → Structure → Project
  public executeCycle(): RuntimeCycleResult {
    if (!this.running) {
      this.start();
    }

    const sensed = this.sensePhase(this.state);
    const structured = this.structurePhase(sensed);
    const { newState, events } = this.projectPhase(structured);

    this.state = newState;
    return {
      worldState: structuredClone(this.state),
      triggeredEvents: events,
    };
  }

  // 执行多次循环
  public async executeCycles(count: number, delayMs = 0): Promise<RuntimeCycleResult[]> {
    const results: RuntimeCycleResult[] = [];
    for (let i = 0; i < count; i++) {
      const r = this.executeCycle();
      results.push(r);
      if (delayMs > 0) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
    return results;
  }

  // =========================
  // Sense 阶段：读取状态，分析风险与主线情况（White Layer）
  // =========================
  private sensePhase(state: WorldState): WorldState {
    // 这里可以做复杂分析，目前先简单更新时间索引
    const newState: WorldState = {
      ...state,
      timeIndex: state.timeIndex + 1,
    };

    // 增强：九核系统感知
    // 使用感知核、防御核、元认知核分析状态
    for (const entity of newState.entities) {
      if (entity.mindProfile) {
        const cores = entity.mindProfile.cores;
        
        // 感知核：检测风险
        if (cores.perceptual > 0.7) {
          // 高感知能力可以提前发现风险
          if (newState.globalParameters.entropyLevel > 0.6) {
            // 检测到高熵，可以触发防御机制
          }
        }
        
        // 防御核：保护结构稳定性
        if (cores.defensive > 0.7 && entity.state) {
          // 高防御能力可以维持结构稳定性
          entity.state.structuralStability = clamp01(
            entity.state.structuralStability + 0.01
          );
        }
        
        // 元认知核：调整策略
        if (cores.metacog > 0.7) {
          // 高元认知可以优化收敛路径
          if (entity.fateVector) {
            // 轻微提升收敛度
            entity.fateVector.convergenceScore = clamp01(
              entity.fateVector.convergenceScore + 0.01
            );
          }
        }
      }
    }

    return newState;
  }

  // =========================
  // Structure 阶段：选出候选 FateNode / Event（Blue Layer）
  // =========================
  private structurePhase(state: WorldState): WorldState {
    // 这里先不改 state，只做「结构准备」
    // 例如：根据当前节点，从 FateGraph 中找可到达的下一个节点
    // 真正选择在 Project 阶段做
    
    // 增强：检查是否需要创建新分支
    const activeTimelines = state.activeTimelines.filter(t => t.status === "ACTIVE");
    for (const timeline of activeTimelines) {
      const currentNode = findFateNode(state.fateGraph, timeline.currentNodeId);
      if (currentNode && currentNode.structuralImpact > 0.7) {
        // 高结构影响节点可能触发分支
        const outgoing = state.fateGraph.arcs.filter(
          (arc) => arc.fromNodeId === timeline.currentNodeId
        );
        if (outgoing.length > 1 && Math.random() < 0.3) {
          // 30% 概率创建分支
          // 分支将在 Project 阶段创建
        }
      }
    }
    
    return state;
  }

  // =========================
  // Project 阶段：推进命运与事件（Gold Layer）
  // =========================
  private projectPhase(state: WorldState): { newState: WorldState; events: Event[] } {
    const events: Event[] = [];

    let worldState = structuredClone(state);

    // 1. 为每条时间线选择下一个 FateNode（支持分支）
    const newTimelines: Timeline[] = [];
    
    worldState.activeTimelines.forEach((tl) => {
      if (tl.status !== "ACTIVE") {
        newTimelines.push(tl);
        return;
      }

      const outgoing = worldState.fateGraph.arcs.filter(
        (arc) => arc.fromNodeId === tl.currentNodeId
      );
      if (outgoing.length === 0) {
        // 没有后续节点，则时间线崩塌
        newTimelines.push({ ...tl, status: "COLLAPSED" });
        return;
      }

      const currentNode = findFateNode(worldState.fateGraph, tl.currentNodeId);
      const shouldBranch = currentNode && 
                          currentNode.structuralImpact > 0.7 && 
                          outgoing.length > 1 && 
                          Math.random() < 0.3 &&
                          newTimelines.length < this.config.maxTimelines;

      // 简单随机 + 概率权重选择
      const r = Math.random();
      let acc = 0;
      let chosen: FateArc | undefined;
      for (const arc of outgoing) {
        acc += arc.probability;
        if (r <= acc) {
          chosen = arc;
          break;
        }
      }
      if (!chosen) chosen = outgoing[outgoing.length - 1];

      const nextNode = findFateNode(worldState.fateGraph, chosen.toNodeId);
      if (!nextNode) {
        newTimelines.push(tl);
        return;
      }

      const newHistory = [...tl.pathHistory, nextNode.id];
      const newConv = clamp01(tl.convergenceScore + nextNode.convergenceDelta);

      const updatedTimeline: Timeline = {
        ...tl,
        currentNodeId: nextNode.id,
        pathHistory: newHistory,
        convergenceScore: newConv,
      };
      newTimelines.push(updatedTimeline);

      // 如果应该分支，创建新时间线
      if (shouldBranch && chosen) {
        // 选择另一个路径
        const otherArcs = outgoing.filter(a => a.id !== chosen.id);
        if (otherArcs.length > 0) {
          const branchArc = randomChoice(otherArcs) || otherArcs[0];
          const branchNode = findFateNode(worldState.fateGraph, branchArc.toNodeId);
          if (branchNode) {
            const branchTimeline: Timeline = {
              id: `timeline-branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              originNodeId: tl.currentNodeId,
              currentNodeId: branchNode.id,
              pathHistory: [...tl.pathHistory, branchNode.id],
              convergenceScore: clamp01(tl.convergenceScore + branchNode.convergenceDelta - 0.1), // 分支收敛度略低
              status: "ACTIVE",
            };
            newTimelines.push(branchTimeline);
            
            // 添加分支事件
            events.push({
              id: `evt-branch-${worldState.timeIndex}-${branchTimeline.id}`,
              name: "时间线分支",
              triggerNodeId: tl.currentNodeId,
              structuralEffect: {},
              description: `时间线 ${tl.id} 在节点 ${tl.currentNodeId} 处发生分支`,
              timelineEffect: {
                createBranchFromTimelineId: tl.id,
              },
            });
          }
        }
      }
    });

    worldState.activeTimelines = newTimelines;

    // 2. 计算全局收束度
    const globalConvergence = computeGlobalConvergence(worldState.activeTimelines);

    // 3. 若收束度过低，触发「结构校正事件」
    if (globalConvergence < this.config.convergenceThreshold) {
      const correctionEvent: Event = {
        id: `evt-correction-${worldState.timeIndex}`,
        name: "结构校正事件",
        structuralEffect: {
          globalDelta: {
            structuralPressure: clamp01(
              worldState.globalParameters.structuralPressure + 0.05
            ),
          },
          entityDeltas: this.applyMainlineCorrection(worldState),
        },
        description: "当主线收束度过低时，宇宙生成的自发纠偏事件。",
      };
      events.push(correctionEvent);
      worldState = this.applyEvent(worldState, correctionEvent);
    }

    // 4. 限制时间线数量（防爆炸）
    if (worldState.activeTimelines.length > this.config.maxTimelines) {
      worldState.activeTimelines = this.pruneTimelines(worldState.activeTimelines);
    }

    return { newState: worldState, events };
  }

  // 针对主线节点的纠偏：提高与「杜浩麟」相关实体的收束度
  private applyMainlineCorrection(state: WorldState): Array<{
    entityId: string;
    stateDelta?: Partial<EntityState>;
    convergenceDelta?: number;
  }> {
    const deltas: Array<{
      entityId: string;
      stateDelta?: Partial<EntityState>;
      convergenceDelta?: number;
    }> = [];

    for (const e of state.entities) {
      if (!e.identityProfile || !e.fateVector) continue;
      const name = e.identityProfile.name;
      const isMainline =
        name.includes(this.config.mainlineOriginName) ||
        (e.identityProfile.mainlineWeight ?? 0) > 0.7;

      if (isMainline) {
        deltas.push({
          entityId: e.id,
          convergenceDelta: 0.05,
          stateDelta: {
            structuralStability: clamp01(
              (e.state?.structuralStability ?? 0.5) + 0.05
            ),
          },
        });
      }
    }

    return deltas;
  }

  // 应用事件到世界状态
  private applyEvent(state: WorldState, event: Event): WorldState {
    const newState = structuredClone(state);

    // 全局参数
    if (event.structuralEffect.globalDelta) {
      newState.globalParameters = {
        ...newState.globalParameters,
        ...event.structuralEffect.globalDelta,
      };
    }

    // 实体变更
    if (event.structuralEffect.entityDeltas) {
      for (const delta of event.structuralEffect.entityDeltas) {
        const idx = newState.entities.findIndex((e) => e.id === delta.entityId);
        if (idx === -1) continue;
        const ent = newState.entities[idx];

        const newStatePart: EntityState = {
          health: ent.state?.health ?? 1,
          energy: ent.state?.energy ?? 1,
          structuralStability: ent.state?.structuralStability ?? 0.5,
          ...delta.stateDelta,
        };

        const newFateVector: FateVector = {
          convergenceScore: clamp01(
            (ent.fateVector?.convergenceScore ?? 0.5) +
              (delta.convergenceDelta ?? 0)
          ),
          divergenceScore: clamp01(
            (ent.fateVector?.divergenceScore ?? 0.5) -
              (delta.convergenceDelta ?? 0)
          ),
        };

        newState.entities[idx] = {
          ...ent,
          state: newStatePart,
          fateVector: newFateVector,
        };
      }
    }

    // 时间线操作（这里暂时只实现合并/裁剪，在后续可扩展）
    if (event.timelineEffect?.mergeTimelineIds) {
      newState.activeTimelines = this.mergeTimelines(
        newState.activeTimelines,
        event.timelineEffect.mergeTimelineIds
      );
    }

    return newState;
  }

  // 简单时间线裁剪：保留收束度最高的 N 条
  private pruneTimelines(timelines: Timeline[]): Timeline[] {
    const active = timelines.filter((t) => t.status === "ACTIVE");
    const others = timelines.filter((t) => t.status !== "ACTIVE");

    const sorted = [...active].sort(
      (a, b) => b.convergenceScore - a.convergenceScore
    );
    const keep = sorted.slice(0, this.config.maxTimelines);
    const dropped = sorted.slice(this.config.maxTimelines).map((t) => ({
      ...t,
      status: "COLLAPSED" as TimelineStatus,
    }));

    return [...keep, ...dropped, ...others];
  }

  // 时间线合并：简单取平均 + 拼接历史
  private mergeTimelines(
    timelines: Timeline[],
    idsToMerge: string[]
  ): Timeline[] {
    const keep: Timeline[] = [];
    const merging: Timeline[] = [];

    for (const tl of timelines) {
      if (idsToMerge.includes(tl.id)) merging.push(tl);
      else keep.push(tl);
    }

    if (merging.length === 0) return timelines;

    const merged: Timeline = {
      id: `merged-${idsToMerge.join("+")}`,
      originNodeId: merging[0].originNodeId,
      currentNodeId: merging[merging.length - 1].currentNodeId,
      pathHistory: merging.flatMap((m) => m.pathHistory),
      convergenceScore:
        merging.reduce((acc, t) => acc + t.convergenceScore, 0) /
        merging.length,
      status: "ACTIVE",
    };

    return [...keep, merged];
  }
}

