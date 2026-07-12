// Technology Tree Engine
import { TECHNOLOGY_LABELS, TECHNOLOGY_TYPES, type TechnologyType } from "@/constants/sequence-world/civilization/technologyTypes";

export interface TechnologyNode {
  nodeId: string;
  name: string;
  techType: TechnologyType;
  description: string;
  requiredResources: string[];
  requiredInstitutions: string[];
  unlockConditions: string[];
  effects: string[];
  risk: string[];
  unlocked: boolean;
}

export interface TechnologyTree {
  treeId: string;
  worldId: string;
  nodes: TechnologyNode[];
  unlockedNodes: string[];
  lockedNodes: string[];
  currentLevel: number;
  breakthroughPressure: number;
}

const DIGIT_TECH: Record<string, TechnologyType[]> = {
  "3": ["WRITING","COMMUNICATION_NETWORK"],
  "4": ["GOVERNANCE_SYSTEM","ARCHIVE_SYSTEM"],
  "5": ["METALLURGY","WORLD_ENGINEERING"],
  "6": ["AGRICULTURE","ENERGY_SYSTEM"],
  "8": ["MARKET_SYSTEM","NAVIGATION"],
  "9": ["STAR_ARCHIVE_TECH","TERMINAL_INFRASTRUCTURE","SEQUENCE_COMPILATION"],
  "0": ["ARCHIVE_SYSTEM","RESEED_PROTOCOL"],
};

export function buildTechnologyTree(input: {
  worldId: string; sourceDigits?: string[]; eraCount?: number;
}): TechnologyTree {
  const digits = input.sourceDigits ?? [];
  const set = new Set<TechnologyType>(["AGRICULTURE","WRITING"]);
  digits.forEach(d => (DIGIT_TECH[d] ?? []).forEach(t => set.add(t)));
  const list: TechnologyType[] = [];
  for (const t of TECHNOLOGY_TYPES) if (set.has(t)) list.push(t);

  const unlockCount = Math.min(list.length, 2 + (input.eraCount ?? 0));
  const nodes: TechnologyNode[] = list.map((t, i) => ({
    nodeId: `${input.worldId}-tech-${i}`,
    name: TECHNOLOGY_LABELS[t],
    techType: t,
    description: `${TECHNOLOGY_LABELS[t]} 节点。`,
    requiredResources: t === "ENERGY_SYSTEM" ? ["能量晶体"] : [],
    requiredInstitutions: t === "GOVERNANCE_SYSTEM" ? ["议会"] : [],
    unlockConditions: i < unlockCount ? [] : [`需达到第 ${i} 纪`],
    effects: [`提升 ${TECHNOLOGY_LABELS[t]} 能力`],
    risk: t === "WORLD_ENGINEERING" || t === "STAR_ARCHIVE_TECH" ? ["可能引发规则失效"] : [],
    unlocked: i < unlockCount,
  }));
  return {
    treeId: `${input.worldId}-techtree`,
    worldId: input.worldId,
    nodes,
    unlockedNodes: nodes.filter(n => n.unlocked).map(n => n.nodeId),
    lockedNodes: nodes.filter(n => !n.unlocked).map(n => n.nodeId),
    currentLevel: unlockCount,
    breakthroughPressure: digits.includes("5") ? 0.7 : 0.4,
  };
}
