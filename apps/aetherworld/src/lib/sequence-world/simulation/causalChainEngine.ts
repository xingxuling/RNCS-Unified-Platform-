// Causal Chain Engine — 因果链
import type { CausalEventType } from "@/constants/sequence-world/simulation/causalEventTypes";

export interface CausalChainNode {
  id: string;
  tick: number;
  eventId: string;
  causeType: CausalEventType;
  causeSummary: string;
  effectSummary: string;
  affectedZones: string[];
  affectedNpcs: string[];
  strength: number;
}

export function addCausalNode(chain: CausalChainNode[], node: Omit<CausalChainNode, "id">): CausalChainNode[] {
  return [...chain, { ...node, id: `causal-${node.tick}-${Math.random().toString(36).slice(2, 7)}` }];
}

export function findCauses(chain: CausalChainNode[], effectKeyword: string): CausalChainNode[] {
  return chain.filter(n => n.effectSummary.includes(effectKeyword));
}

export function findEffects(chain: CausalChainNode[], causeKeyword: string): CausalChainNode[] {
  return chain.filter(n => n.causeSummary.includes(causeKeyword));
}

export function exportCausalGraph(chain: CausalChainNode[]) {
  return {
    nodes: chain.map(n => ({ id: n.id, label: n.causeSummary, tick: n.tick, type: n.causeType })),
    edges: chain.map(n => ({ from: n.causeSummary, to: n.effectSummary, strength: n.strength })),
  };
}

export function detectContradictions(chain: CausalChainNode[]): string[] {
  const warnings: string[] = [];
  // 简易检测：相邻 tick 出现互斥效果
  for (let i = 1; i < chain.length; i++) {
    if (chain[i].tick === chain[i - 1].tick &&
        chain[i].effectSummary && chain[i - 1].effectSummary &&
        chain[i].effectSummary.includes("开放") && chain[i - 1].effectSummary.includes("封存")) {
      warnings.push(`Tick ${chain[i].tick}: 同 tick 出现开放/封存矛盾`);
    }
  }
  return warnings;
}
