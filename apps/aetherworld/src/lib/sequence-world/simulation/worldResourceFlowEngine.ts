// World Resource Flow Engine
import { SIM_WORLD_RESOURCES, type SimWorldResourceId } from "@/constants/sequence-world/simulation/worldResourceTypes";

export interface WorldResourceChange {
  resourceId: SimWorldResourceId;
  amount: number;
  reason: string;
  tick: number;
  sourceEvent?: string;
}

export interface WorldResourceFlow {
  resources: Record<string, number>;
  inflow: WorldResourceChange[];
  outflow: WorldResourceChange[];
  dominantResource: string;
  scarcityWarnings: string[];
}

export function emptyFlow(): WorldResourceFlow {
  const resources: Record<string, number> = {};
  SIM_WORLD_RESOURCES.forEach(r => { resources[r.id] = 10; });
  return { resources, inflow: [], outflow: [], dominantResource: "WIND_CRYSTAL", scarcityWarnings: [] };
}

export function applyTickFlow(flow: WorldResourceFlow, tick: number, dominantDigits: string[], eventType?: string): WorldResourceFlow {
  const next: WorldResourceFlow = { ...flow, resources: { ...flow.resources }, inflow: [...flow.inflow], outflow: [...flow.outflow] };
  // 数列主导带来产出
  dominantDigits.forEach(d => {
    const r = SIM_WORLD_RESOURCES.find(x => x.digitTrigger === d);
    if (r) {
      next.resources[r.id] = (next.resources[r.id] ?? 0) + 1;
      next.inflow.push({ resourceId: r.id, amount: 1, reason: `主导数 ${d}`, tick });
    }
  });
  // 事件影响
  if (eventType === "ARCHIVE") {
    next.resources.ARCHIVE_SHARD = (next.resources.ARCHIVE_SHARD ?? 0) + 2;
    next.inflow.push({ resourceId: "ARCHIVE_SHARD", amount: 2, reason: "归档事件", tick, sourceEvent: eventType });
  }
  if (eventType === "CONFLICT") {
    next.resources.LIFE_SEED = Math.max(0, (next.resources.LIFE_SEED ?? 0) - 1);
    next.outflow.push({ resourceId: "LIFE_SEED", amount: 1, reason: "世界过载消耗", tick, sourceEvent: eventType });
  }
  if (eventType === "DISCOVERY" || eventType === "NPC_MEMORY_TRIGGER") {
    next.resources.EXPRESSION_INK = (next.resources.EXPRESSION_INK ?? 0) + 1;
    next.inflow.push({ resourceId: "EXPRESSION_INK", amount: 1, reason: "剧情产出", tick, sourceEvent: eventType });
  }
  // 稀缺警告
  next.scarcityWarnings = Object.entries(next.resources)
    .filter(([, v]) => v <= 2)
    .map(([k, v]) => `${k} 储量过低 (${v})`);
  // dominant
  const sorted = Object.entries(next.resources).sort((a, b) => b[1] - a[1]);
  next.dominantResource = sorted[0]?.[0] ?? "WIND_CRYSTAL";
  return next;
}
