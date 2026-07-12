import type { SimulatedWorldState, SimulatedNpc } from "../simulation/worldSimulationCore";
import type { SimulatedZone } from "../simulation/zoneEcologyEngine";
import type { SimulatedEvent } from "../simulation/eventScheduler";
import type { CausalChainNode } from "../simulation/causalChainEngine";
import type { WorldResourceFlow } from "../simulation/worldResourceFlowEngine";
import { DIGIT_EXPANSION_THEMES, type WorldExpansionType } from "@/constants/sequence-world/growth/worldExpansionTypes";

export interface ExpansionInput {
  worldId: string;
  worldState: SimulatedWorldState;
  zones: SimulatedZone[];
  npcs: SimulatedNpc[];
  causalChain?: CausalChainNode[];
  resourceFlow?: WorldResourceFlow;
  targetExpansionType?: WorldExpansionType;
  sourceDigits?: string[];
}

export interface ExpansionResult {
  expansionType: WorldExpansionType;
  generatedItems: Array<Record<string, unknown>>;
  newZones: SimulatedZone[];
  newNpcs: SimulatedNpc[];
  newEvents: SimulatedEvent[];
  reason: string;
  requiredCanonUpdates: string[];
  risks: string[];
}

function pickDigit(input: ExpansionInput): string {
  const d = input.sourceDigits?.[0] ?? input.worldState.activeDigits?.[0] ?? "5";
  return d;
}

function chooseType(input: ExpansionInput): WorldExpansionType {
  if (input.targetExpansionType) return input.targetExpansionType;
  const zoneCount = input.zones.length;
  const npcCount = input.npcs.length;
  if (zoneCount < 4) return "ZONE_EXPANSION";
  if (npcCount < zoneCount) return "NPC_EXPANSION";
  return "QUEST_EXPANSION";
}

export function expandWorld(input: ExpansionInput): ExpansionResult {
  const type = chooseType(input);
  const digit = pickDigit(input);
  const theme = DIGIT_EXPANSION_THEMES[digit] ?? DIGIT_EXPANSION_THEMES["5"];
  const tick = input.worldState.tick;
  const newZones: SimulatedZone[] = [];
  const newNpcs: SimulatedNpc[] = [];
  const newEvents: SimulatedEvent[] = [];
  const generatedItems: Array<Record<string, unknown>> = [];
  const canonUpdates: string[] = [];
  const risks: string[] = [];
  let reason = "";

  switch (type) {
    case "ZONE_EXPANSION": {
      const zone: SimulatedZone = {
        zoneId: `zone-${tick}-${Math.random().toString(36).slice(2, 6)}`,
        name: `${theme.zone}·${digit}`,
        zoneType: "EXPANSION",
        stability: 0.5, eventPressure: 0.3, resourceDensity: 0.4, npcDensity: 0.3, hiddenLayer: 0.2,
        dominantDigits: [digit],
        activeEvents: [], availableResources: [], connectedZones: [],
      };
      newZones.push(zone);
      generatedItems.push({ kind: "ZONE", name: zone.name, flavor: theme.flavor });
      canonUpdates.push(`新增区域：${zone.name}（${theme.flavor}）`);
      reason = `区域不足或主导数 ${digit} 适合扩张「${theme.zone}」`;
      break;
    }
    case "NPC_EXPANSION": {
      const baseZone = input.zones[input.npcs.length % Math.max(1, input.zones.length)];
      const npc: SimulatedNpc = {
        npcId: `npc-${tick}-${Math.random().toString(36).slice(2, 6)}`,
        name: `${theme.zone}守护者`,
        archetype: theme.flavor,
        currentZone: baseZone?.zoneId ?? "z-core",
        currentGoal: `守护${theme.zone}`,
        trust: 0.5, conflict: 0.2, memoryCount: 0,
        likelyNextAction: `巡视${theme.zone}`,
      };
      newNpcs.push(npc);
      generatedItems.push({ kind: "NPC", name: npc.name, flavor: theme.flavor });
      canonUpdates.push(`新增 NPC：${npc.name}`);
      reason = `世界需要承载主导数 ${digit} 的对应角色`;
      break;
    }
    case "QUEST_EXPANSION": {
      const evt: SimulatedEvent = {
        id: `evt-${tick}-${Math.random().toString(36).slice(2, 6)}`,
        title: `${theme.zone}·任务链`,
        eventType: "DISCOVERY",
        triggerCondition: `主导=${digit}`,
        probability: 0.6, pressure: 0.4,
        affectedZones: input.zones.slice(0, 2).map(z => z.zoneId),
        affectedNpcs: input.npcs.slice(0, 2).map(n => n.npcId),
        possibleOutcomes: [`推进${theme.flavor}`],
        safetyNotes: ["虚拟事件，仅为世界模拟。"],
      };
      newEvents.push(evt);
      generatedItems.push({ kind: "QUEST", ...evt });
      canonUpdates.push(`新增任务：${evt.title}`);
      reason = `主导数 ${digit} 触发任务链扩张`;
      break;
    }
    case "RESOURCE_EXPANSION":
      generatedItems.push({ kind: "RESOURCE", name: `${theme.zone}资源节点`, digit });
      canonUpdates.push(`新增资源节点：${theme.zone}`);
      reason = "资源经济需要新增节点";
      break;
    case "LORE_EXPANSION":
      generatedItems.push({ kind: "LORE", title: `${theme.zone}起源传说`, flavor: theme.flavor });
      canonUpdates.push(`新增世界观条目：${theme.zone}起源`);
      reason = "世界观需要补全";
      break;
    case "SYSTEM_EXPANSION":
      generatedItems.push({ kind: "SYSTEM", name: `${theme.zone}系统`, digit });
      canonUpdates.push(`新增系统规则：${theme.zone}`);
      reason = "新增系统层规则";
      break;
    case "RELATION_EXPANSION":
      generatedItems.push({ kind: "RELATION", desc: `${theme.zone}关系网络` });
      canonUpdates.push(`新增关系网络：${theme.zone}`);
      reason = "扩张人际/势力关系";
      break;
    case "TIMELINE_EXPANSION":
      generatedItems.push({ kind: "TIMELINE", name: `${theme.zone}分支` });
      reason = "矛盾压力建议分支";
      risks.push("分支可能造成正典分歧，请评估");
      break;
  }

  if (input.worldState.entropyLevel && input.worldState.entropyLevel > 0.8) {
    risks.push("世界熵值偏高，扩张前建议压缩");
  }

  return { expansionType: type, generatedItems, newZones, newNpcs, newEvents, reason, requiredCanonUpdates: canonUpdates, risks };
}
