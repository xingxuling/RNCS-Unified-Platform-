// Civilization Evolution Engine — v0.5 main orchestrator
import { generateEraSequence, type CivilizationEra } from "./eraTransitionEngine";
import { buildHistoricalTimeline, type HistoricalTimeline } from "./historicalTimelineEngine";
import { computeCivilizationCycle, type CivilizationCycleState } from "./civilizationCycleEngine";
import { buildTechnologyTree, type TechnologyTree } from "./technologyTreeEngine";
import { computeMagicRuleTech, type MagicRuleTechState } from "./magicRuleTechEngine";
import { buildInstitutionLineages, type InstitutionLineage } from "./institutionLineageEngine";
import { buildEconomicCycles, type EconomicCycle } from "./economicCycleEngine";
import { buildWarPeaceRecords, type WarPeaceRecord } from "./warPeaceEngine";
import { buildCatastrophes, type CatastropheEvent } from "./catastropheEngine";
import { buildReforms, type ReformMovement } from "./reformMovementEngine";
import { buildHistoricalFigures, type HistoricalFigure } from "./historicalFigureEngine";
import { buildCivilizationMyths, type CivilizationMyth } from "./civilizationMythEngine";
import { buildHistoricalDisputes, type HistoricalDispute } from "./historicalDisputeEngine";
import { buildChronicle, type CivilizationChronicle } from "./civilizationChronicleEngine";
import {
  compressCivilization, type CivilizationCompressionResult, type CivilizationCompressionTarget,
} from "./civilizationCompressionEngine";
import { checkCivilizationSafety, CIVILIZATION_SAFETY_NOTE } from "./civilizationSafetyGuard";
import {
  CIVILIZATION_PHASE_V2_LABELS, type CivilizationPhaseV2,
} from "@/constants/sequence-world/civilization/civilizationPhasesV2";

export interface CivilizationEvolutionInput {
  worldId: string;
  societyState?: {
    factions?: { factionId: string; name: string }[];
    institutions?: { institutionId: string; name: string; institutionType: string }[];
    npcAgents?: { agentId: string; name: string }[];
    socialConflictsCount?: number;
  };
  evolutionMode: "SAFE" | "CREATIVE" | "HISTORICAL" | "MYTHIC" | "FOUNDER";
  mslProgram?: string;
  userAction?: string;
  eraSteps?: number;
  maxHistoricalEvents?: number;
  sourceDigits?: string[];
  subjectMode?: string;
  isFull60?: boolean;
  willPublic?: boolean;
  compressionTarget?: CivilizationCompressionTarget;
}

export interface CivilizationEvolutionResult {
  worldId: string;
  evolutionMode: string;
  currentEra: CivilizationEra;
  civilizationPhase: CivilizationPhaseV2;
  civilizationPhaseLabel: string;
  eras: CivilizationEra[];
  timeline: HistoricalTimeline;
  cycleState: CivilizationCycleState;
  technologyTree: TechnologyTree;
  magicRuleTechState: MagicRuleTechState;
  institutionLineages: InstitutionLineage[];
  economicCycles: EconomicCycle[];
  warPeaceRecords: WarPeaceRecord[];
  catastrophes: CatastropheEvent[];
  reformMovements: ReformMovement[];
  historicalFigures: HistoricalFigure[];
  civilizationMyths: CivilizationMyth[];
  historicalDisputes: HistoricalDispute[];
  chronicle: CivilizationChronicle;
  compression?: CivilizationCompressionResult;
  safetyNotes: string[];
  metadata: {
    version: "0.5.0";
    generatedAt: string;
    subjectMode: string;
  };
}

function pickPhase(eraCount: number, collapseRisk: number): CivilizationPhaseV2 {
  if (collapseRisk > 0.8) return "TERMINAL_CIVILIZATION";
  if (eraCount <= 1) return "PRIMAL_SEED";
  if (eraCount === 2) return "TRIBAL_NETWORK";
  if (eraCount === 3) return "CITY_STATE";
  if (eraCount === 4) return "GUILD_SOCIETY";
  if (eraCount === 5) return "RULED_CIVILIZATION";
  if (eraCount === 6) return "EXPANSION";
  if (eraCount === 7) return "FRACTURED_ERA";
  if (eraCount === 8) return "ARCHIVE_CIVILIZATION";
  if (eraCount === 9) return "STAR_RELIC";
  return "RESEED_CIVILIZATION";
}

export function runCivilizationEvolution(input: CivilizationEvolutionInput): CivilizationEvolutionResult {
  const safety = checkCivilizationSafety({
    evolutionMode: input.evolutionMode,
    isFull60: input.isFull60,
    willPublic: input.willPublic,
    maxHistoricalEvents: input.maxHistoricalEvents,
  });

  const factions = input.societyState?.factions ?? [];
  const institutions = input.societyState?.institutions ?? [];
  const agents = input.societyState?.npcAgents ?? [];
  const conflictsCount = input.societyState?.socialConflictsCount ?? 0;

  const steps = Math.max(1, Math.min(input.eraSteps ?? 6, safety.appliedLimits.maxEras));
  const eras = generateEraSequence({
    worldId: input.worldId, steps, sourceDigits: input.sourceDigits,
    factions: factions.map(f => f.factionId),
    institutions: institutions.map(i => i.institutionId),
  });

  const timeline = buildHistoricalTimeline({
    worldId: input.worldId, eras, sourceDigits: input.sourceDigits,
    factions, maxEvents: Math.min(input.maxHistoricalEvents ?? 24, safety.appliedLimits.maxHistoricalEvents),
    userAction: input.userAction,
  });

  const cycleState = computeCivilizationCycle({
    sourceDigits: input.sourceDigits, conflictsCount, eraCount: eras.length,
  });

  const technologyTree = buildTechnologyTree({
    worldId: input.worldId, sourceDigits: input.sourceDigits, eraCount: eras.length,
  });
  const magicRuleTechState = computeMagicRuleTech({
    sourceDigits: input.sourceDigits, techLevel: technologyTree.currentLevel,
  });
  const institutionLineages = buildInstitutionLineages({
    worldId: input.worldId, institutions, eras,
  });
  const economicCycles = buildEconomicCycles({
    worldId: input.worldId, eras, sourceDigits: input.sourceDigits,
  });
  const warPeaceRecords = buildWarPeaceRecords({
    worldId: input.worldId, eras, factions,
    sourceDigits: input.sourceDigits,
    maxRecords: safety.appliedLimits.maxWarRecords,
  });
  const catastrophes = buildCatastrophes({
    worldId: input.worldId, sourceDigits: input.sourceDigits,
    maxCatastrophes: safety.appliedLimits.maxCatastrophes,
  });
  const reformMovements = buildReforms({
    worldId: input.worldId, sourceDigits: input.sourceDigits,
    maxReforms: safety.appliedLimits.maxReforms,
  });
  const historicalFigures = buildHistoricalFigures({
    worldId: input.worldId, eras, agents,
    sourceDigits: input.sourceDigits, maxFigures: safety.appliedLimits.maxFigures,
  });
  const civilizationMyths = buildCivilizationMyths({
    worldId: input.worldId, events: timeline.events,
    maxMyths: safety.appliedLimits.maxMyths,
  });
  const historicalDisputes = buildHistoricalDisputes({
    worldId: input.worldId, events: timeline.events, factions,
  });
  const chronicle = buildChronicle({
    worldId: input.worldId, eras, events: timeline.events,
    figures: historicalFigures, wars: warPeaceRecords, myths: civilizationMyths,
  });

  const currentEra = eras[eras.length - 1];
  const civilizationPhase = pickPhase(eras.length, cycleState.collapseRisk);

  let compression: CivilizationCompressionResult | undefined;
  if (input.compressionTarget) {
    compression = compressCivilization({ target: input.compressionTarget, chronicle });
  }

  return {
    worldId: input.worldId,
    evolutionMode: input.evolutionMode,
    currentEra,
    civilizationPhase,
    civilizationPhaseLabel: CIVILIZATION_PHASE_V2_LABELS[civilizationPhase],
    eras,
    timeline,
    cycleState,
    technologyTree,
    magicRuleTechState,
    institutionLineages,
    economicCycles,
    warPeaceRecords,
    catastrophes,
    reformMovements,
    historicalFigures,
    civilizationMyths,
    historicalDisputes,
    chronicle,
    compression,
    safetyNotes: safety.notes,
    metadata: {
      version: "0.5.0",
      generatedAt: new Date().toISOString(),
      subjectMode: input.subjectMode ?? "DEMO",
    },
  };
}

export { CIVILIZATION_SAFETY_NOTE };
