// World Growth Engine — 主调度
import type { WorldGrowthMode } from "@/constants/sequence-world/growth/worldGrowthModes";
import type { WorldExpansionType } from "@/constants/sequence-world/growth/worldExpansionTypes";
import type { WorldCompressionLevel } from "@/constants/sequence-world/growth/worldCompressionLevels";
import { expandWorld, type ExpansionResult } from "./worldExpansionEngine";
import { applyRuleEvolution, suggestRulesFromState, type WorldRule } from "./worldRuleEvolutionEngine";
import { autoDraftCanonFromExpansion, type WorldCanonEntry } from "./worldCanonEngine";
import { scanContradictions, type WorldContradiction } from "./worldContradictionResolver";
import { compressWorld, type WorldCompressionResult } from "./worldCompressionEngine";
import { createBranchFromSnapshot, type WorldBranchTimeline } from "./worldBranchTimelineEngine";
import { registerAsset, valuateAsset, type WorldAsset } from "./worldAssetRegistry";
import { appendLog } from "./worldEvolutionLogger";
import { checkGrowthSafety, WORLD_GROWTH_SAFETY_NOTE } from "./worldGrowthSafetyGuard";
import { WORLD_GROWTH_HARD_LIMITS } from "@/constants/sequence-world/growth/worldGrowthSafetyRules";
import type { SimulatedWorldState, SimulatedNpc } from "../simulation/worldSimulationCore";
import type { SimulatedZone } from "../simulation/zoneEcologyEngine";
import type { SimulatedEvent } from "../simulation/eventScheduler";

export interface WorldGrowthInput {
  worldId: string;
  worldState: SimulatedWorldState;
  zones: SimulatedZone[];
  npcs: SimulatedNpc[];
  events?: SimulatedEvent[];
  growthMode: WorldGrowthMode;
  mslProgram?: string;
  userFeedback?: string[];
  growthGoal?: string;
  maxGrowthSteps?: number;
  isFull60?: boolean;
  isFounder?: boolean;
  willPublic?: boolean;
  preferredExpansion?: WorldExpansionType;
  sourceDigits?: string[];
}

export interface WorldGrowthStep {
  stepId: string;
  stepType: string;
  reason: string;
  sourceTrigger: string;
  resultSummary: string;
  affectedSystems: string[];
}

export interface WorldGrowthResult {
  worldId: string;
  growthMode: WorldGrowthMode;
  growthSteps: WorldGrowthStep[];
  newZones: SimulatedZone[];
  newNpcs: SimulatedNpc[];
  newEvents: SimulatedEvent[];
  newRules: WorldRule[];
  canonUpdates: WorldCanonEntry[];
  contradictions: WorldContradiction[];
  compressionResult?: WorldCompressionResult;
  branchTimelines: WorldBranchTimeline[];
  registeredAssets: WorldAsset[];
  safetyNotes: string[];
  nextRecommendedAction: string;
}

function stepId(i: number) { return `gstep-${Date.now().toString(36)}-${i}`; }

export function runWorldGrowth(input: WorldGrowthInput): WorldGrowthResult {
  const safety = checkGrowthSafety({
    growthMode: input.growthMode,
    maxGrowthSteps: input.maxGrowthSteps,
    isFull60: input.isFull60,
    isFounder: input.isFounder,
    willPublic: input.willPublic,
  });
  const safetyNotes: string[] = [...safety.notes];
  const result: WorldGrowthResult = {
    worldId: input.worldId, growthMode: input.growthMode,
    growthSteps: [], newZones: [], newNpcs: [], newEvents: [], newRules: [],
    canonUpdates: [], contradictions: [], branchTimelines: [], registeredAssets: [],
    safetyNotes, nextRecommendedAction: "",
  };
  if (!safety.ok) {
    result.nextRecommendedAction = "请修改生长参数后重试";
    return result;
  }

  const steps = Math.min(safety.cappedSteps, input.maxGrowthSteps ?? safety.cappedSteps);
  let zonesAdded = 0, npcsAdded = 0;

  for (let i = 0; i < steps; i++) {
    if (zonesAdded >= WORLD_GROWTH_HARD_LIMITS.maxNewZonesPerRun && npcsAdded >= WORLD_GROWTH_HARD_LIMITS.maxNewNpcsPerRun) break;
    const expansion: ExpansionResult = expandWorld({
      worldId: input.worldId,
      worldState: input.worldState,
      zones: [...input.zones, ...result.newZones],
      npcs: [...input.npcs, ...result.newNpcs],
      targetExpansionType: input.preferredExpansion,
      sourceDigits: input.sourceDigits,
    });
    result.newZones.push(...expansion.newZones);
    result.newNpcs.push(...expansion.newNpcs);
    result.newEvents.push(...expansion.newEvents);
    zonesAdded += expansion.newZones.length;
    npcsAdded += expansion.newNpcs.length;

    const drafts = autoDraftCanonFromExpansion(input.worldId, expansion.generatedItems as any, input.worldState.tick);
    result.canonUpdates.push(...drafts);

    drafts.forEach(d => {
      const a = registerAsset({
        worldId: input.worldId,
        assetType: (d.entryType === "WORLD_RULE" ? "RULE" : d.entryType) as any,
        name: d.title, summary: d.summary,
        canonLevel: d.canonLevel, reusable: true, exportable: true,
        valuationInput: { canonLevel: d.canonLevel, reusable: true, hasCausalChain: true, hasNarrativeUse: true },
      });
      result.registeredAssets.push(a);
    });

    result.growthSteps.push({
      stepId: stepId(i),
      stepType: expansion.expansionType,
      reason: expansion.reason,
      sourceTrigger: input.mslProgram ? `MSL:${input.mslProgram.slice(0, 40)}` : (input.userFeedback?.[0] ?? "AUTO"),
      resultSummary: expansion.requiredCanonUpdates.join("；") || expansion.reason,
      affectedSystems: ["ZONES","NPCS","EVENTS","CANON","ASSETS"],
    });
    if (expansion.risks.length) safetyNotes.push(...expansion.risks);
  }

  // suggested rules
  const ruleSuggestions = suggestRulesFromState(input.worldId, {
    eventSpam: (input.events?.length ?? 0) > 8,
    npcConflictHigh: (input.npcs.length ?? 0) > 12,
    resourceInflated: (input.worldState.entropyLevel ?? 0) > 0.7,
  });
  ruleSuggestions.forEach(rs => {
    const r = applyRuleEvolution({ action: "CREATE_RULE", worldId: input.worldId, rule: rs, isFounder: input.isFounder });
    if (r.ok && r.rule) result.newRules.push(r.rule);
  });

  // contradiction scan
  result.contradictions = scanContradictions({
    worldId: input.worldId,
    canon: result.canonUpdates,
  });

  // auto compression for high-load
  if (input.growthMode === "AUTO_REPAIR" || result.contradictions.some(c => c.severity === "HIGH" || c.severity === "CRITICAL")) {
    result.compressionResult = compressWorld({
      worldId: input.worldId,
      compressionLevel: "PLAYABLE_CORE" as WorldCompressionLevel,
      canon: result.canonUpdates,
      isFounder: input.isFounder,
    });
  }

  // branch timeline if critical
  const crit = result.contradictions.find(c => c.severity === "CRITICAL");
  if (crit) {
    const t = createBranchFromSnapshot({
      worldId: input.worldId, snapshotTick: input.worldState.tick,
      name: `自动分支-${crit.contradictionType}`, reason: crit.explanation,
    });
    result.branchTimelines.push(t);
  }

  appendLog({
    worldId: input.worldId,
    tick: input.worldState.tick,
    actionType: "WORLD_GROWTH",
    actionSummary: `生长 ${result.growthSteps.length} 步｜新增区域 ${result.newZones.length}｜新增NPC ${result.newNpcs.length}｜正典 ${result.canonUpdates.length}｜矛盾 ${result.contradictions.length}`,
    source: input.mslProgram ? "MSL" : input.isFounder ? "FOUNDER" : "USER",
    affectedAssets: result.registeredAssets.map(a => a.assetId),
    safetyNotes: result.safetyNotes,
  });

  result.nextRecommendedAction = result.contradictions.length
    ? "检查并修复矛盾（World Contradictions）"
    : result.compressionResult
      ? result.compressionResult.nextRecommendedAction
      : "继续 World Growth 或导出 Runtime";

  return result;
}

export { WORLD_GROWTH_SAFETY_NOTE };
