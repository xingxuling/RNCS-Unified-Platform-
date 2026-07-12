// NPC Agent Core
import { DIGIT_TO_AGENT_TYPE, AGENT_TYPE_LABELS, type AgentType } from "@/constants/sequence-world/society/agentTypes";

export interface NpcAgent {
  agentId: string;
  name: string;
  archetype: AgentType;
  socialRole: string;
  factionId?: string;
  institutionIds: string[];
  currentZone: string;
  longTermGoal: string;
  shortTermGoal: string;
  beliefProfile: string[];
  resourceNeeds: string[];
  socialBonds: string[];
  trustMap: Record<string, number>;
  conflictMap: Record<string, number>;
  memorySummary: string;
  agencyLevel: number;
  autonomyLevel: number;
  safetyFlags: string[];
}

export interface BuildAgentsInput {
  worldId: string;
  sourceDigits?: string[];
  zones: { id?: string; name?: string }[];
  maxAgents: number;
  existingNames?: string[];
}

const NAME_POOL = ["岚","澈","知","璇","渊","煊","旸","昭","祁","纾","槿","遥","砚","隽","沐","稷","乔","禾","琢","寒"];

function pickName(seed: number, used: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const n = NAME_POOL[(seed + i) % NAME_POOL.length] + NAME_POOL[(seed * 3 + i) % NAME_POOL.length];
    if (!used.has(n)) { used.add(n); return n; }
  }
  return `Agent-${seed}`;
}

export function buildNpcAgents(input: BuildAgentsInput): NpcAgent[] {
  const digits = input.sourceDigits ?? ["1","2","3","4","5","6","7","8","9","0"];
  const used = new Set(input.existingNames ?? []);
  const agents: NpcAgent[] = [];
  const count = Math.min(input.maxAgents, digits.length);
  for (let i = 0; i < count; i++) {
    const d = digits[i] ?? "1";
    const archetype = DIGIT_TO_AGENT_TYPE[d] ?? "GUIDE_AGENT";
    const zone = input.zones[i % Math.max(1, input.zones.length)];
    const name = pickName(i + (parseInt(d, 10) || 0) * 7, used);
    agents.push({
      agentId: `${input.worldId}-agent-${i}`,
      name,
      archetype,
      socialRole: AGENT_TYPE_LABELS[archetype],
      institutionIds: [],
      currentZone: zone?.id ?? zone?.name ?? "zone-0",
      longTermGoal: `守护并发展自身${AGENT_TYPE_LABELS[archetype]}之道`,
      shortTermGoal: `参与当前区域 ${zone?.name ?? ""} 的事件`,
      beliefProfile: [],
      resourceNeeds: [],
      socialBonds: [],
      trustMap: {},
      conflictMap: {},
      memorySummary: "尚无重大记忆。",
      agencyLevel: 0.5 + (parseInt(d, 10) || 0) * 0.04,
      autonomyLevel: 0.4 + ((parseInt(d, 10) || 0) % 5) * 0.1,
      safetyFlags: [],
    });
  }
  return agents;
}
