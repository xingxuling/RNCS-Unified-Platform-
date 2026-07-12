// World Simulation Core — 统一调度
import type { SequenceCoreProfile } from "../sequenceCoreEngine";
import { evaluateNextPhase } from "./worldStateMachine";
import { initialTime, advanceTime, type WorldTimeState } from "./worldTimeEngine";
import { scheduleEvents, type SimulatedEvent } from "./eventScheduler";
import { buildDefaultZones, applyDigitBias, type SimulatedZone } from "./zoneEcologyEngine";
import { emptyFlow, applyTickFlow, type WorldResourceFlow } from "./worldResourceFlowEngine";
import { addCausalNode, type CausalChainNode } from "./causalChainEngine";
import { createMemory, appendMemory, decayMemory, type NpcMemory } from "./npcMemoryEngine";
import { createSnapshot, saveSnapshots, loadSnapshots, type WorldSnapshot } from "./worldSnapshotEngine";
import { appendLog } from "./worldSimulationLogger";
import { MAX_TICKS_PER_RUN, type WorldSimulationModeId } from "@/constants/sequence-world/simulation/worldSimulationModes";
import type { WorldPhaseId } from "@/constants/sequence-world/simulation/worldPhases";
import type { WorldTickType } from "@/constants/sequence-world/simulation/worldTickTypes";

export interface SimulatedWorldState {
  worldId: string;
  worldName: string;
  phase: WorldPhaseId;
  tick: number;
  entropyLevel: number;
  stability: number;
  eventPressure: number;
  resourcePressure: number;
  npcActivity: number;
  causalDensity: number;
  activeDigits: string[];
  dominantDomain: string;
  summary: string;
}

export interface SimulatedNpc {
  npcId: string;
  name: string;
  archetype: string;
  currentZone: string;
  currentGoal: string;
  trust: number;
  conflict: number;
  memoryCount: number;
  likelyNextAction: string;
}

export interface WorldSimulationInput {
  worldId: string;
  worldName?: string;
  sourceSequenceMode: "DEMO" | "LIGHT_20" | "FULL_60" | "OBJECT" | "WORLD" | "FOUNDER";
  sequenceCoreProfile: SequenceCoreProfile;
  initialWorldState?: Partial<SimulatedWorldState>;
  zones?: SimulatedZone[];
  npcProfiles?: SimulatedNpc[];
  questEvents?: SimulatedEvent[];
  mslProgram?: string[];
  simulationMode: WorldSimulationModeId;
  tickCount?: number;
  userFeedback?: string[];
}

export interface WorldSimulationResult {
  worldId: string;
  simulationMode: WorldSimulationModeId;
  currentPhase: WorldPhaseId;
  currentTick: number;
  time: WorldTimeState;
  worldState: SimulatedWorldState;
  activeZones: SimulatedZone[];
  activeNpcs: SimulatedNpc[];
  activeEvents: SimulatedEvent[];
  causalChain: CausalChainNode[];
  resourceFlow: WorldResourceFlow;
  npcMemory: Record<string, NpcMemory>;
  snapshots: WorldSnapshot[];
  warnings: string[];
  safetyNotes: string[];
}

function defaultNpcs(zones: SimulatedZone[]): SimulatedNpc[] {
  return [
    { npcId: "npc-elder",  name: "归元长者", archetype: "ELDER",     currentZone: zones[0]?.zoneId ?? "z-core",
      currentGoal: "守护秩序", trust: 0.5, conflict: 0,   memoryCount: 0, likelyNextAction: "提示玩家" },
    { npcId: "npc-trader", name: "风之商旅", archetype: "TRADER",    currentZone: zones[1]?.zoneId ?? "z-frontier",
      currentGoal: "交易资源", trust: 0.4, conflict: 0,   memoryCount: 0, likelyNextAction: "兜售物资" },
    { npcId: "npc-rebel",  name: "边境异客", archetype: "REBEL",     currentZone: zones[1]?.zoneId ?? "z-frontier",
      currentGoal: "打破规则", trust: 0.2, conflict: 0.3, memoryCount: 0, likelyNextAction: "挑战权威" },
  ];
}

function initWorldState(input: WorldSimulationInput): SimulatedWorldState {
  const c = input.sequenceCoreProfile;
  return {
    worldId: input.worldId,
    worldName: input.worldName ?? `${c.name} · 模拟世界`,
    phase: "SEED",
    tick: 0,
    entropyLevel: 0.2,
    stability: 0.6,
    eventPressure: 0.2,
    resourcePressure: 0.2,
    npcActivity: 0.3,
    causalDensity: 0,
    activeDigits: c.dominantDigits,
    dominantDomain: Object.entries(c.fiveDomainBias).sort()[0]?.[1] ?? "—",
    summary: `世界初始化：主导 ${c.dominantDigits.join("·")}，相位 SEED`,
    ...(input.initialWorldState ?? {}),
  };
}

export function startSimulation(input: WorldSimulationInput): WorldSimulationResult {
  const cap = MAX_TICKS_PER_RUN[input.simulationMode];
  const requested = Math.max(0, Math.min(input.tickCount ?? 1, cap));
  const zones = input.zones ?? buildDefaultZones(input.sequenceCoreProfile.dominantDigits);
  const npcs = input.npcProfiles ?? defaultNpcs(zones);
  let state = initWorldState(input);
  let time = initialTime();
  let causal: CausalChainNode[] = [];
  let flow = emptyFlow();
  let memMap: Record<string, NpcMemory> = {};
  npcs.forEach(n => { memMap[n.npcId] = createMemory(n.npcId); });
  let events: SimulatedEvent[] = input.questEvents ?? [];
  const warnings: string[] = [];

  for (let i = 0; i < requested; i++) {
    const res = runTickInternal({ state, time, zones, npcs, events, causal, flow, memMap,
      tickType: "NORMAL", dominantDigits: input.sequenceCoreProfile.dominantDigits,
      userAction: input.userFeedback?.[i] });
    state = res.state; time = res.time; events = res.events;
    causal = res.causal; flow = res.flow; memMap = res.memMap;
    warnings.push(...res.warnings);
  }

  const snap = createSnapshot({
    worldId: input.worldId, worldState: state, zones, npcs, events,
    resources: flow.resources, causalChainLength: causal.length,
    notes: [`模拟模式 ${input.simulationMode}`, `tick ${requested}`],
  });
  const snapshots = [...loadSnapshots(), snap];
  saveSnapshots(snapshots);

  appendLog({ worldId: input.worldId, tick: state.tick, action: "startSimulation",
    result: `Phase=${state.phase}; tick=${state.tick}`,
    enginesUsed: ["StateMachine", "Time", "Event", "Zone", "Resource", "Causal", "NpcMemory", "Snapshot"],
    safetyNotes: [] });

  return {
    worldId: input.worldId,
    simulationMode: input.simulationMode,
    currentPhase: state.phase,
    currentTick: state.tick,
    time,
    worldState: state,
    activeZones: zones,
    activeNpcs: npcs,
    activeEvents: events,
    causalChain: causal,
    resourceFlow: flow,
    npcMemory: memMap,
    snapshots,
    warnings,
    safetyNotes: [
      "虚拟世界模拟不代表现实事实。",
      input.sourceSequenceMode === "FULL_60" ? "Full60 数据本地保存，导出需二次确认。" : "数据仅保存在本地。",
    ],
  };
}

interface TickCtx {
  state: SimulatedWorldState; time: WorldTimeState;
  zones: SimulatedZone[]; npcs: SimulatedNpc[];
  events: SimulatedEvent[]; causal: CausalChainNode[];
  flow: WorldResourceFlow; memMap: Record<string, NpcMemory>;
  tickType: WorldTickType; dominantDigits: string[]; userAction?: string;
}

function runTickInternal(ctx: TickCtx): TickCtx & { warnings: string[] } {
  const warnings: string[] = [];
  const dom = ctx.dominantDigits[0] ?? "5";
  const time = advanceTime(ctx.time, dom);

  // Phase
  const trans = evaluateNextPhase({
    currentPhase: ctx.state.phase,
    dominantDigits: ctx.dominantDigits,
    eventPressure: ctx.state.eventPressure,
    causalDensity: ctx.causal.length,
    resourcePressure: ctx.state.resourcePressure,
  });
  if (trans.nextPhase === "OVERLOAD") warnings.push("世界进入 OVERLOAD：建议归档或压缩输出");

  // 事件
  const newEvents = scheduleEvents({
    tick: ctx.state.tick + 1,
    dominantDigits: ctx.dominantDigits,
    currentPhase: trans.nextPhase,
    zones: ctx.zones.map(z => z.zoneId),
    npcs: ctx.npcs.map(n => n.npcId),
  }, 1);

  // 资源
  const flow = applyTickFlow(ctx.flow, ctx.state.tick + 1, ctx.dominantDigits, newEvents[0]?.eventType);

  // 因果
  let causal = ctx.causal;
  for (const ev of newEvents) {
    causal = addCausalNode(causal, {
      tick: ctx.state.tick + 1, eventId: ev.id,
      causeType: ctx.userAction ? "USER_ACTION" : "WORLD_STATE",
      causeSummary: ctx.userAction ?? `主导 ${ctx.dominantDigits.join("·")} 推进`,
      effectSummary: ev.title,
      affectedZones: ev.affectedZones, affectedNpcs: ev.affectedNpcs,
      strength: 0.6,
    });
  }

  // NPC 记忆
  const memMap = { ...ctx.memMap };
  for (const ev of newEvents) {
    for (const npcId of ev.affectedNpcs) {
      const mem = memMap[npcId] ?? createMemory(npcId);
      const mt = ev.eventType === "CONFLICT" ? "CONFLICT" :
                 ev.eventType === "ALLIANCE" ? "HELP" :
                 ev.eventType === "RESOURCE_SHIFT" ? "TRADE" : "DIALOGUE";
      memMap[npcId] = decayMemory(appendMemory(mem, ctx.state.tick + 1, mt as any, ev.title, ctx.dominantDigits));
    }
  }
  // NPC 衍生状态
  const npcs = ctx.npcs.map(n => ({
    ...n,
    memoryCount: memMap[n.npcId]?.memories.length ?? 0,
    trust: Math.max(0, Math.min(1, n.trust + ((memMap[n.npcId]?.trustHistory.at(-1) ?? 0) * 0.05))),
  }));

  // 区域更新
  const zones = ctx.zones.map(z => applyDigitBias({
    ...z,
    activeEvents: newEvents.filter(e => e.affectedZones.includes(z.zoneId)).map(e => e.id),
    availableResources: Object.entries(flow.resources).filter(([, v]) => v > 5).map(([k]) => k),
  }));

  const state: SimulatedWorldState = {
    ...ctx.state,
    tick: ctx.state.tick + 1,
    phase: trans.nextPhase,
    entropyLevel: Math.min(1, ctx.state.entropyLevel + 0.02),
    eventPressure: Math.min(1, ctx.state.eventPressure + (newEvents[0]?.pressure ?? 0) * 0.1),
    resourcePressure: flow.scarcityWarnings.length > 0 ? 0.7 : 0.3,
    npcActivity: Math.min(1, ctx.state.npcActivity + 0.05),
    causalDensity: causal.length,
    summary: `Tick ${ctx.state.tick + 1} · 相位=${trans.nextPhase} · ${trans.reason}`,
  };

  return { ...ctx, state, time, events: [...ctx.events, ...newEvents], causal, flow, npcs, zones, memMap, warnings };
}

export function runTick(prev: WorldSimulationResult, opts?: { tickType?: WorldTickType; userAction?: string; dominantDigits?: string[] }): WorldSimulationResult {
  const ctx: TickCtx = {
    state: prev.worldState, time: prev.time, zones: prev.activeZones, npcs: prev.activeNpcs,
    events: prev.activeEvents, causal: prev.causalChain, flow: prev.resourceFlow,
    memMap: prev.npcMemory, tickType: opts?.tickType ?? "NORMAL",
    dominantDigits: opts?.dominantDigits ?? prev.worldState.activeDigits, userAction: opts?.userAction,
  };
  const r = runTickInternal(ctx);
  appendLog({ worldId: prev.worldId, tick: r.state.tick, action: `tick(${r.tickType})`,
    result: r.state.summary, enginesUsed: ["Tick"], safetyNotes: [] });
  return {
    ...prev,
    currentPhase: r.state.phase,
    currentTick: r.state.tick,
    time: r.time,
    worldState: r.state,
    activeZones: r.zones,
    activeNpcs: r.npcs,
    activeEvents: r.events,
    causalChain: r.causal,
    resourceFlow: r.flow,
    npcMemory: r.memMap,
    warnings: r.warnings,
  };
}

export function runManyTicks(prev: WorldSimulationResult, count: number, mode: WorldSimulationModeId = "DEMO"): WorldSimulationResult {
  const cap = MAX_TICKS_PER_RUN[mode];
  const real = Math.min(count, cap);
  let cur = prev;
  for (let i = 0; i < real; i++) cur = runTick(cur);
  return cur;
}

export function buildDemoInput(): WorldSimulationInput {
  return {
    worldId: `demo-${Date.now().toString(36)}`,
    worldName: "Demo 模拟世界",
    sourceSequenceMode: "DEMO",
    sequenceCoreProfile: {
      id: "demo", name: "Demo",
      sequenceMode: "DEMO", targetType: "WORLD",
      digitFrequency: { "5": 5, "1": 1, "6": 1 },
      dominantDigits: ["5", "1", "6"],
      missingDigits: ["0", "2", "3", "4", "7", "8", "9"],
      terminalPattern: "末段 55555 → 收束在变化",
      fiveDomainBias: { heaven: "5·变化", earth: "5·变化", human: "1·开始", spirit: "6·恢复", wind: "5·变化" },
      complexityTier: "LOW",
      generationBias: ["主导 5 → 倾向 变化、事件"],
      riskFlags: [],
    },
    simulationMode: "DEMO",
    tickCount: 3,
  };
}
