// THE SEED v1.0 - Core Type Definitions
// Phase 1: Universe-Level Architecture

// ============================================================================
// UNIVERSE LAYER
// ============================================================================

export interface UniverseConfig {
  tickInterval: number;           // ms between ticks
  timeScale: number;              // 时间尺度倍率
  physicsMode: 'newtonian' | 'quantum' | 'magical' | 'custom';
  maxWorlds: number;
  enableAutoSave: boolean;
  metadata: Record<string, any>;
}

export interface Universe {
  id: string;
  name: string;
  seed: string;                   // 随机种子
  createdAt: number;
  config: UniverseConfig;
  rootWorldId: string;
  status: 'initializing' | 'running' | 'paused' | 'archived';
  currentTick: number;            // 当前 tick 计数
  metadata: Record<string, any>;
}

// ============================================================================
// WORLD LAYER
// ============================================================================

export type WorldLayer = 'base' | 'subspace' | 'dream' | 'instance';

export interface WorldTime {
  tick: number;                   // 世界内 tick
  cycle: number;                  // 周期（天/年/纪元）
  timestamp: number;              // 真实时间戳
}

export interface WorldState {
  id: string;
  name: string;
  status: 'initializing' | 'active' | 'paused' | 'collapsed';
  entropy: number;
  causalWeight: number;
  timestamp: number;
  // v1.0 新增
  resources: Record<string, number>;
  globalVariables: Record<string, any>;
}

export interface World {
  id: string;
  universeId: string;
  name: string;
  layer: WorldLayer;
  state: WorldState;
  rulesetId: string;
  time: WorldTime;
  agentIds: string[];             // 该世界中的所有 Agent
}

// ============================================================================
// AGENT LAYER (Entity v1.0)
// ============================================================================

export type AgentKind = 'player' | 'npc' | 'mob' | 'object' | 'system';

export interface AgentState {
  position: { x: number; y: number; z?: number };
  velocity?: { x: number; y: number; z?: number };
  health?: number;
  energy?: number;
  attributes: Record<string, number>;
  flags: Set<string>;
  inventory?: string[];
}

export interface SoulProfile {
  id: string;
  name: string;
  consciousness: number;          // 意识强度 0-100
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  memory: MemoryEntry[];
  emotions: Record<string, number>;
  beliefs: string[];
  goals: string[];
}

export interface MemoryEntry {
  id: string;
  timestamp: number;
  eventType: string;
  description: string;
  importance: number;
  emotionalImpact: number;
}

export interface Agent {
  id: string;
  worldId: string;
  kind: AgentKind;
  name: string;
  soulProfileId: string;
  state: AgentState;
  fateNodes: string[];            // 关联的命运节点
}

// ============================================================================
// RULE & AETHER LOGIC LAYER
// ============================================================================

export type RuleDomain = 'physics' | 'magic' | 'social' | 'fate' | 'custom';

export interface AetherionCondition {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'matches';
  value: any;
}

export interface Rule {
  id: string;
  worldId: string;
  domain: RuleDomain;
  name: string;
  description: string;
  aetherionCode: string;          // 以太指令代码
  conditions: AetherionCondition[];
  priority: number;
  enabled: boolean;
  executionCount: number;
}

// ============================================================================
// EVENT LAYER
// ============================================================================

export interface Event {
  id: string;
  worldId: string;
  type: string;
  timestamp: number;
  tick: number;
  payload: any;
  sourceAgentId?: string;
  targetAgentId?: string;
  processed: boolean;
}

export interface EventQueue {
  worldId: string;
  events: Event[];
  maxSize: number;
}

// ============================================================================
// FATE LAYER
// ============================================================================

export interface FateEffect {
  type: 'modify_state' | 'spawn_entity' | 'trigger_event' | 'branch_universe' | 'custom';
  target: string;
  params: Record<string, any>;
}

export interface FateNode {
  id: string;
  universeId: string;
  label: string;
  description: string;
  conditions: AetherionCondition[];
  effects: FateEffect[];
  importance: number;
  weight: number;
  nextNodeIds: string[];
  executed: boolean;
  executionCount: number;
}

export interface FateGraph {
  universeId: string;
  nodes: Map<string, FateNode>;
  activeNodeIds: string[];
}

// ============================================================================
// CAUSAL NODE (v0.5 compatibility)
// ============================================================================

export type AetherionOperator = 'CREATE' | 'LOOP' | 'BREAK' | 'SHIFT' | 'WEAVE';

export interface CausalNode {
  id: string;
  type: AetherionOperator;
  description: string;
  weight: number;
  connections: string[];
  executed: boolean;
}

// ============================================================================
// SNAPSHOT & PERSISTENCE
// ============================================================================

export interface UniverseSnapshot {
  id: string;
  universeId: string;
  timestamp: number;
  tick: number;
  label: string;
  worlds: World[];
  agents: Agent[];
  rules: Rule[];
  fateGraph: FateGraph;
  metadata: Record<string, any>;
}

// ============================================================================
// RUNTIME STATE
// ============================================================================

export interface RuntimeStats {
  totalTicks: number;
  ticksPerSecond: number;
  activeUniverses: number;
  activeWorlds: number;
  activeAgents: number;
  eventsProcessed: number;
  rulesExecuted: number;
  averageTickDuration: number;
}
