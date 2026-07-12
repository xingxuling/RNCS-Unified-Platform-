// Event Scheduler — 事件调度
import type { SimulatedEventType } from "@/constants/sequence-world/simulation/causalEventTypes";

export interface SimulatedEvent {
  id: string;
  title: string;
  eventType: SimulatedEventType;
  triggerCondition: string;
  probability: number;
  pressure: number;
  affectedZones: string[];
  affectedNpcs: string[];
  possibleOutcomes: string[];
  safetyNotes: string[];
}

export interface SchedulerInput {
  tick: number;
  dominantDigits: string[];
  currentPhase: string;
  zones: string[];
  npcs: string[];
}

const DIGIT_EVENT_BIAS: Record<string, SimulatedEventType[]> = {
  "0": ["ARCHIVE"],
  "1": ["RESEED", "DISCOVERY"],
  "2": ["ALLIANCE", "NPC_MEMORY_TRIGGER"],
  "3": ["DISCOVERY"],
  "4": ["WORLD_PHASE_SHIFT"],
  "5": ["WORLD_PHASE_SHIFT", "CONFLICT"],
  "6": ["ALLIANCE"],
  "7": ["DISCOVERY", "NPC_MEMORY_TRIGGER"],
  "8": ["RESOURCE_SHIFT"],
  "9": ["WORLD_PHASE_SHIFT", "FOUNDER_EVENT"],
};

export function scheduleEvents(input: SchedulerInput, max = 1): SimulatedEvent[] {
  const types: SimulatedEventType[] = [];
  input.dominantDigits.forEach(d => {
    (DIGIT_EVENT_BIAS[d] ?? []).forEach(t => { if (!types.includes(t)) types.push(t); });
  });
  if (!types.length) types.push("DISCOVERY");

  return types.slice(0, max).map((t, i) => ({
    id: `evt-${input.tick}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    title: titleFor(t, input.dominantDigits),
    eventType: t,
    triggerCondition: `相位=${input.currentPhase}; 主导=${input.dominantDigits.join(",")}`,
    probability: 0.6,
    pressure: t === "CONFLICT" ? 0.8 : t === "ARCHIVE" ? 0.2 : 0.4,
    affectedZones: input.zones.slice(0, 2),
    affectedNpcs: input.npcs.slice(0, 2),
    possibleOutcomes: outcomesFor(t),
    safetyNotes: ["虚拟事件，仅为世界模拟，不代表现实必然发生。"],
  }));
}

function titleFor(t: SimulatedEventType, digits: string[]): string {
  const map: Record<SimulatedEventType, string> = {
    DISCOVERY: "新发现", CONFLICT: "冲突上升", ALLIANCE: "关系结盟", RESOURCE_SHIFT: "资源变动",
    ARCHIVE: "归档收束", RESEED: "再种子启动", NPC_MEMORY_TRIGGER: "NPC 记忆触发",
    WORLD_PHASE_SHIFT: "世界相位变化", FOUNDER_EVENT: "创始人事件", REALITY_ANCHOR_EVENT: "现实锚点事件",
  };
  return `${map[t]} · ${digits.join("·") || "—"}`;
}
function outcomesFor(t: SimulatedEventType): string[] {
  switch (t) {
    case "CONFLICT": return ["NPC 信任下降", "区域事件压力上升"];
    case "ALLIANCE": return ["NPC 信任上升", "新关系线"];
    case "RESOURCE_SHIFT": return ["资源流入/流出", "区域资源密度变化"];
    case "ARCHIVE": return ["区域封存", "产生 ARCHIVE_SHARD"];
    case "WORLD_PHASE_SHIFT": return ["相位切换", "时间相位重计"];
    default: return ["世界状态微调"];
  }
}
