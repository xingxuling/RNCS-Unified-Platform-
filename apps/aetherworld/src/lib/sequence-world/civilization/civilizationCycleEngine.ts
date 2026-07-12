// Civilization Cycle Engine
import { CYCLE_LABELS, type CycleStage, type CycleType } from "@/constants/sequence-world/civilization/cycleTypes";

export interface CivilizationCycleState {
  cycleType: CycleType;
  cycleLabel: string;
  currentStage: CycleStage;
  pressure: number;
  stability: number;
  renewalPotential: number;
  collapseRisk: number;
  nextLikelyStage: CycleStage;
}

const STAGE_NEXT: Record<CycleStage, CycleStage> = {
  SEED: "GROWTH", GROWTH: "PEAK", PEAK: "TENSION", TENSION: "FRACTURE",
  FRACTURE: "DECLINE", DECLINE: "ARCHIVE", ARCHIVE: "RESEED", RESEED: "SEED",
};

export function computeCivilizationCycle(input: {
  sourceDigits?: string[]; conflictsCount?: number; eraCount?: number;
}): CivilizationCycleState {
  const d = input.sourceDigits ?? [];
  const has = (x: string) => d.includes(x);
  let cycleType: CycleType = "RISE_AND_FALL";
  if (has("5") && has("8")) cycleType = "EXPANSION_AND_FRAGMENTATION";
  else if (has("4") && has("2")) cycleType = "ORDER_AND_REBELLION";
  else if (has("0") && has("7")) cycleType = "MEMORY_AND_FORGETTING";
  else if (has("8")) cycleType = "RESOURCE_BOOM_AND_CRISIS";
  else if (has("9")) cycleType = "FAITH_AND_DOUBT";
  else if (has("5")) cycleType = "WAR_AND_PEACE";
  else if (has("0")) cycleType = "COLLAPSE_AND_RESEED";

  const stages: CycleStage[] = ["SEED","GROWTH","PEAK","TENSION","FRACTURE","DECLINE","ARCHIVE","RESEED"];
  const stageIdx = Math.min(stages.length - 1, input.eraCount ?? 0);
  const currentStage = stages[stageIdx];

  const pressure = Math.min(1, 0.2 + (input.conflictsCount ?? 0) * 0.08 + (has("5") ? 0.2 : 0));
  const stability = Math.max(0, 1 - pressure - (has("0") ? 0.1 : 0));
  const renewalPotential = has("6") || has("1") ? 0.7 : 0.4;
  const collapseRisk = Math.min(1, pressure * 0.6 + (has("9") ? 0.2 : 0));

  return {
    cycleType,
    cycleLabel: CYCLE_LABELS[cycleType],
    currentStage,
    pressure: +pressure.toFixed(2),
    stability: +stability.toFixed(2),
    renewalPotential: +renewalPotential.toFixed(2),
    collapseRisk: +collapseRisk.toFixed(2),
    nextLikelyStage: STAGE_NEXT[currentStage],
  };
}
