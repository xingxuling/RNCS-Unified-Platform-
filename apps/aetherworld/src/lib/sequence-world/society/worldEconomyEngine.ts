// World Economy Engine (virtual, non-financial)
import { ECONOMY_RESOURCE_TYPES, ECONOMY_DISCLAIMER, type EconomyResourceType } from "@/constants/sequence-world/society/economyTypes";

export interface TradeRoute {
  routeId: string;
  fromZone: string;
  toZone: string;
  resourceId: EconomyResourceType;
  volume: number;
  risk: number;
}
export interface WorldEconomyState {
  resources: Record<string, number>;
  scarcity: Record<string, number>;
  demand: Record<string, number>;
  supply: Record<string, number>;
  tradeRoutes: TradeRoute[];
  wealthCenters: string[];
  economicTension: number;
  economySummary: string;
  disclaimer: string;
}

export function buildEconomy(input: {
  worldId: string;
  sourceDigits?: string[];
  zones: { id?: string; name?: string }[];
}): WorldEconomyState {
  const digits = input.sourceDigits ?? [];
  const has = (d: string) => digits.includes(d);
  const resources: Record<string, number> = {};
  const supply: Record<string, number> = {};
  const demand: Record<string, number> = {};
  ECONOMY_RESOURCE_TYPES.forEach(r => {
    resources[r] = 50; supply[r] = 50; demand[r] = 50;
  });
  if (has("8")) { resources.ORE += 30; supply.ORE += 20; demand.ORE += 10; }
  if (has("4")) { resources.GRAIN += 15; supply.GRAIN += 10; }
  if (has("5")) { Object.keys(resources).forEach(k => resources[k] += (Math.random() - 0.5) * 20); }
  if (has("0")) { ECONOMY_RESOURCE_TYPES.forEach(r => supply[r] = Math.max(0, supply[r] - 15)); }
  if (has("6")) { resources.GRAIN += 10; resources.TEXTILE += 10; }
  if (has("9")) { resources.HERITAGE_ASSET += 30; }
  if (has("7")) { resources.BLACK_MARKET_GOOD += 20; }

  const scarcity: Record<string, number> = {};
  ECONOMY_RESOURCE_TYPES.forEach(r => {
    scarcity[r] = Math.max(0, Math.min(1, (demand[r] - supply[r]) / 100 + 0.5));
  });

  const tradeRoutes: TradeRoute[] = [];
  for (let i = 0; i < Math.min(6, input.zones.length); i++) {
    const a = input.zones[i];
    const b = input.zones[(i + 1) % input.zones.length];
    if (!a || !b || a === b) continue;
    tradeRoutes.push({
      routeId: `${input.worldId}-route-${i}`,
      fromZone: a.id ?? a.name ?? `zone-${i}`,
      toZone: b.id ?? b.name ?? `zone-${i+1}`,
      resourceId: ECONOMY_RESOURCE_TYPES[i % ECONOMY_RESOURCE_TYPES.length],
      volume: 20 + i * 5,
      risk: 0.1 + (has("5") ? 0.3 : 0),
    });
  }
  const tension = Object.values(scarcity).reduce((a, b) => a + b, 0) / ECONOMY_RESOURCE_TYPES.length;
  return {
    resources, scarcity, demand, supply,
    tradeRoutes,
    wealthCenters: input.zones.slice(0, 2).map(z => z.id ?? z.name ?? "zone"),
    economicTension: tension,
    economySummary: `共 ${tradeRoutes.length} 条贸易路径｜张力 ${(tension * 100).toFixed(0)}%`,
    disclaimer: ECONOMY_DISCLAIMER,
  };
}
