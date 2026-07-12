// Catastrophe Engine
import { CATASTROPHE_LABELS, type CatastropheType } from "@/constants/sequence-world/civilization/catastropheTypes";

export interface CatastropheEvent {
  catastropheId: string;
  title: string;
  catastropheType: CatastropheType;
  catastropheLabel: string;
  triggerCause: string;
  affectedZones: string[];
  affectedFactions: string[];
  severity: number;
  survivalFactors: string[];
  recoveryPath: string[];
  mythicImpact: number;
}

const DIGIT_CATA: Record<string, CatastropheType[]> = {
  "0": ["VOID_EXPANSION","CIVILIZATION_ARCHIVE"],
  "5": ["WORLD_STORM","RULE_FAILURE"],
  "7": ["MEMORY_LOSS","BELIEF_BREAK"],
  "9": ["TERMINAL_SIGNAL","RESEED_CATASTROPHE"],
  "8": ["RESOURCE_COLLAPSE"],
};

export function buildCatastrophes(input: {
  worldId: string; sourceDigits?: string[]; maxCatastrophes?: number;
}): CatastropheEvent[] {
  const d = input.sourceDigits ?? [];
  const set = new Set<CatastropheType>();
  d.forEach(x => (DIGIT_CATA[x] ?? []).forEach(c => set.add(c)));
  if (set.size === 0) set.add("RESOURCE_COLLAPSE");
  const max = input.maxCatastrophes ?? 6;
  return Array.from(set).slice(0, max).map((t, i) => ({
    catastropheId: `${input.worldId}-cata-${i}`,
    title: CATASTROPHE_LABELS[t],
    catastropheType: t,
    catastropheLabel: CATASTROPHE_LABELS[t],
    triggerCause: `${CATASTROPHE_LABELS[t]} 触发条件成熟`,
    affectedZones: [],
    affectedFactions: [],
    severity: 0.5 + (d.includes("9") ? 0.2 : 0),
    survivalFactors: d.includes("6") ? ["生态恢复","互助网络"] : ["分散迁徙","集体记忆"],
    recoveryPath: ["进入再种子阶段","重建归档","重启制度"],
    mythicImpact: 0.7,
  }));
}
