// Autonomous Event Engine
import { AUTONOMOUS_EVENT_TYPES, AUTONOMOUS_EVENT_LABELS, MAX_AUTONOMOUS_EVENTS_PER_TICK, type AutonomousEventType } from "@/constants/sequence-world/society/autonomousEventTypes";
import type { NpcAgent } from "./npcAgentCore";
import type { WorldFaction } from "./factionEngine";

export interface AutonomousWorldEvent {
  eventId: string;
  title: string;
  eventType: AutonomousEventType;
  triggerReason: string;
  involvedAgents: string[];
  involvedFactions: string[];
  affectedZones: string[];
  consequences: string[];
  userVisible: boolean;
  safetyNotes: string[];
}

export function runAutonomousEvents(input: {
  worldId: string;
  tick: number;
  agents: NpcAgent[];
  factions: WorldFaction[];
  sourceDigits?: string[];
  enabled?: boolean;
}): AutonomousWorldEvent[] {
  if (input.enabled === false) return [];
  const digits = input.sourceDigits ?? [];
  const count = Math.min(MAX_AUTONOMOUS_EVENTS_PER_TICK, digits.includes("5") ? 2 : 1);
  const events: AutonomousWorldEvent[] = [];
  const pool: AutonomousEventType[] = [];
  if (digits.includes("8")) pool.push("TRADE_DISPUTE","RESOURCE_SHORTAGE");
  if (digits.includes("4")) pool.push("INSTITUTION_REFORM","RULE_CHALLENGE");
  if (digits.includes("9")) pool.push("CIVILIZATION_RITUAL","BELIEF_CONFLICT");
  if (digits.includes("7")) pool.push("SECRET_MEETING","MEMORY_DISCOVERY");
  if (digits.includes("5")) pool.push("NPC_MIGRATION");
  if (digits.includes("2")) pool.push("FACTION_NEGOTIATION");
  if (pool.length === 0) pool.push(...AUTONOMOUS_EVENT_TYPES);

  for (let i = 0; i < count; i++) {
    const type = pool[(input.tick + i) % pool.length];
    const fa = input.factions[(input.tick + i) % Math.max(1, input.factions.length)];
    const ag = input.agents[(input.tick + i) % Math.max(1, input.agents.length)];
    events.push({
      eventId: `${input.worldId}-ae-${input.tick}-${i}`,
      title: `${AUTONOMOUS_EVENT_LABELS[type]}（tick ${input.tick}）`,
      eventType: type,
      triggerReason: `数列权重触发：${digits.slice(0,5).join("")}`,
      involvedAgents: ag ? [ag.agentId] : [],
      involvedFactions: fa ? [fa.factionId] : [],
      affectedZones: ag ? [ag.currentZone] : [],
      consequences: [`${AUTONOMOUS_EVENT_LABELS[type]} 对社会状态产生轻量影响`],
      userVisible: true,
      safetyNotes: ["虚拟世界自治事件，不构成现实事件。"],
    });
  }
  return events;
}
