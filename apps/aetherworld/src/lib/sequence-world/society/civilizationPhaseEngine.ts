// Civilization Phase Engine
import { CIVILIZATION_PHASES, CIVILIZATION_PHASE_LABELS, type CivilizationPhase } from "@/constants/sequence-world/society/civilizationPhases";
import type { WorldFaction } from "./factionEngine";
import type { WorldInstitution } from "./institutionEngine";

export interface CivilizationPhaseState {
  phase: CivilizationPhase;
  phaseLabel: string;
  stability: number;
  complexity: number;
  technologyLevel: number;
  magicOrRuleLevel: number;
  socialTrust: number;
  resourceBase: number;
  narrativeMaturity: number;
  nextPhaseHint: string;
}

function digitCount(digits: string[], d: string) { return digits.filter(x => x === d).length; }

export function computeCivilizationPhase(input: {
  agentsCount: number;
  factions: WorldFaction[];
  institutions: WorldInstitution[];
  sourceDigits?: string[];
}): CivilizationPhaseState {
  const digits = input.sourceDigits ?? [];
  const c1 = digitCount(digits, "1");
  const c2 = digitCount(digits, "2");
  const c3 = digitCount(digits, "3");
  const c4 = digitCount(digits, "4");
  const c5 = digitCount(digits, "5");
  const c6 = digitCount(digits, "6");
  const c8 = digitCount(digits, "8");
  const c9 = digitCount(digits, "9");
  const c0 = digitCount(digits, "0");

  let phase: CivilizationPhase = "PRIMAL_SEED";
  if (c1 >= 2 && input.agentsCount < 4) phase = "PRIMAL_SEED";
  else if (c2 >= 2 && input.factions.length <= 2) phase = "TRIBAL_NETWORK";
  else if (input.institutions.length >= 2) phase = "CITY_STATE";
  else if (input.institutions.length >= 4) phase = "GUILD_SOCIETY";
  if (c4 >= 3) phase = "RULED_CIVILIZATION";
  if (c5 >= 3) phase = "FRACTURED_ERA";
  if (c8 >= 3 && c9 >= 2) phase = "STAR_ARCHIVE_CIVILIZATION";
  if (c9 >= 4) phase = "TERMINAL_CIVILIZATION";
  if (c0 >= 4) phase = "RESEED_CIVILIZATION";

  const stability = Math.max(0.1, Math.min(1, 0.5 + (c4 + c6) * 0.05 - c5 * 0.05));
  const complexity = Math.min(1, (input.factions.length + input.institutions.length) / 18);
  const next = CIVILIZATION_PHASES[Math.min(CIVILIZATION_PHASES.length - 1, CIVILIZATION_PHASES.indexOf(phase) + 1)];

  return {
    phase, phaseLabel: CIVILIZATION_PHASE_LABELS[phase],
    stability, complexity,
    technologyLevel: Math.min(1, c8 * 0.15 + c4 * 0.1),
    magicOrRuleLevel: Math.min(1, c4 * 0.12 + c9 * 0.1),
    socialTrust: Math.max(0, 0.6 + c2 * 0.05 - c5 * 0.05),
    resourceBase: Math.min(1, c8 * 0.12 + c6 * 0.08),
    narrativeMaturity: Math.min(1, c3 * 0.1 + c9 * 0.08),
    nextPhaseHint: `下一阶段提示：${CIVILIZATION_PHASE_LABELS[next]}`,
  };
}
