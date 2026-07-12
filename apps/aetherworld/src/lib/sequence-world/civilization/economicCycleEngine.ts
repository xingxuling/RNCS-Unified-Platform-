// Economic Cycle Engine
import { ECONOMIC_CYCLE_FICTION_NOTE, ECONOMIC_CYCLE_LABELS, type EconomicCycleType } from "@/constants/sequence-world/civilization/economicCycleTypes";
import type { CivilizationEra } from "./eraTransitionEngine";

export interface EconomicCycle {
  cycleId: string;
  cycleType: EconomicCycleType;
  cycleLabel: string;
  phase: "RISE" | "PEAK" | "TENSION" | "CRISIS" | "ARCHIVE";
  dominantResources: string[];
  wealthCenters: string[];
  crisisRisk: number;
  inequalityLevel: number;
  tradeNetworkStrength: number;
  summary: string;
  fictionDisclaimer: string;
}

const DIGIT_CYCLE: Record<string, EconomicCycleType> = {
  "8": "TRADE_EXPANSION", "5": "RESOURCE_DISCOVERY_BOOM",
  "4": "MARKET_CONSOLIDATION", "0": "ARCHIVE_ECONOMY",
  "9": "SEQUENCE_VALUE_ECONOMY", "2": "SCARCITY_CRISIS",
};

export function buildEconomicCycles(input: {
  worldId: string; eras: CivilizationEra[]; sourceDigits?: string[];
}): EconomicCycle[] {
  return input.eras.map((era, i) => {
    const d = era.dominantDigits[0] ?? "4";
    const type: EconomicCycleType = DIGIT_CYCLE[d] ?? "MARKET_CONSOLIDATION";
    const phases: EconomicCycle["phase"][] = ["RISE","PEAK","TENSION","CRISIS","ARCHIVE"];
    const phase = phases[i % phases.length];
    return {
      cycleId: `${input.worldId}-econ-${i}`,
      cycleType: type,
      cycleLabel: ECONOMIC_CYCLE_LABELS[type],
      phase,
      dominantResources: ["象征矿","记录晶","风之纤维"].slice(0, 2),
      wealthCenters: [era.name],
      crisisRisk: phase === "CRISIS" ? 0.8 : 0.3,
      inequalityLevel: type === "RESOURCE_MONOPOLY" ? 0.8 : 0.4,
      tradeNetworkStrength: type === "TRADE_EXPANSION" ? 0.8 : 0.5,
      summary: `${era.name}：${ECONOMIC_CYCLE_LABELS[type]}（${phase}）`,
      fictionDisclaimer: ECONOMIC_CYCLE_FICTION_NOTE,
    };
  });
}
