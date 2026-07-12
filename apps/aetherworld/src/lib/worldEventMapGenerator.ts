// 世界区域 & 事件地图生成
import { WORLD_ZONE_TEMPLATES, type WorldZoneState } from "@/constants/worldZoneTypes";
import { PREDICTION_DIMENSIONS } from "@/constants/predictionDimensions";
import type { WorldSeed } from "./worldSeedCompiler";

export interface WorldZone {
  zoneName: string;
  dimensionId: string;
  state: WorldZoneState;
  explanation: string;
  currentEvents: string[];
  recommendedActions: string[];
}

export interface WorldEventItem {
  eventTypeId: string;
  dimensionId: string;
  category: "recurring" | "strong" | "risk" | "unopened" | "needs_review";
  label: string;
}

export interface WorldEventMap {
  recurring: WorldEventItem[];
  strong: WorldEventItem[];
  risk: WorldEventItem[];
  unopened: WorldEventItem[];
  needsReview: WorldEventItem[];
}

function decideState(seed: WorldSeed, dimNumbers: number[]): WorldZoneState {
  const freq = dimNumbers.reduce((a, n) => a + (seed.digitFrequency[n] ?? 0), 0);
  if (freq === 0) return "HIDDEN";
  if (freq <= 1) return "LOCKED";
  if (freq <= 3) return "FORMING";
  if (freq >= 8) return "OVERLOADED";
  return "OPEN";
}

export function generateWorldZones(seed: WorldSeed, dominantDomain: string): WorldZone[] {
  const zones: WorldZone[] = WORLD_ZONE_TEMPLATES.map(t => {
    const dim = PREDICTION_DIMENSIONS.find(d => d.id === t.dimensionId);
    const state = decideState(seed, dim?.relatedNumbers ?? []);
    return {
      zoneName: t.zoneName,
      dimensionId: t.dimensionId,
      state,
      explanation: t.baseDescription,
      currentEvents: dim?.defaultEventTypes?.slice(0, 2) ?? [],
      recommendedActions: t.recommendedActions,
    };
  });

  // 排序：主导域优先，然后开放状态优先
  const order: Record<WorldZoneState, number> = { OPEN: 0, FORMING: 1, OVERLOADED: 2, LOCKED: 3, HIDDEN: 4 };
  return zones.sort((a, b) => {
    const dimA = PREDICTION_DIMENSIONS.find(d => d.id === a.dimensionId);
    const dimB = PREDICTION_DIMENSIONS.find(d => d.id === b.dimensionId);
    const aDom = dimA?.relatedDomains?.includes(dominantDomain) ? 0 : 1;
    const bDom = dimB?.relatedDomains?.includes(dominantDomain) ? 0 : 1;
    if (aDom !== bDom) return aDom - bDom;
    return order[a.state] - order[b.state];
  });
}

export function generateEventMap(zones: WorldZone[]): WorldEventMap {
  const recurring: WorldEventItem[] = [];
  const strong: WorldEventItem[] = [];
  const risk: WorldEventItem[] = [];
  const unopened: WorldEventItem[] = [];
  const needsReview: WorldEventItem[] = [];

  zones.forEach(z => {
    const dim = PREDICTION_DIMENSIONS.find(d => d.id === z.dimensionId);
    const label = dim?.name ?? z.dimensionId;
    z.currentEvents.forEach(ev => {
      const item: WorldEventItem = { eventTypeId: ev, dimensionId: z.dimensionId, category: "recurring", label: `${label} · ${ev}` };
      if (z.state === "OPEN") recurring.push(item);
      else if (z.state === "OVERLOADED") { strong.push({ ...item, category: "strong" }); risk.push({ ...item, category: "risk" }); }
      else if (z.state === "FORMING") needsReview.push({ ...item, category: "needs_review" });
      else if (z.state === "HIDDEN" || z.state === "LOCKED") unopened.push({ ...item, category: "unopened" });
    });
  });

  return {
    recurring: recurring.slice(0, 6),
    strong: strong.slice(0, 4),
    risk: risk.slice(0, 4),
    unopened: unopened.slice(0, 6),
    needsReview: needsReview.slice(0, 4),
  };
}
