import { resolveNarrativeMode, type NarrativeModeResolution } from "./narrativeModeResolver";
import { buildStorySeed, type StorySeed, type StorySeedInput } from "./storySeedEngine";
import { buildPlotStructure, type PlotStructureResult } from "./plotStructureEngine";
import { generateScene, type SceneOutput } from "./sceneGenerator";
import { generateDialogue, type DialogueResult } from "./dialogueEngine";
import { buildCharacterArc, type CharacterArc } from "./characterArcEngine";
import { buildConflict, type ConflictResult } from "./conflictEngine";
import { checkPacing, type PacingResult } from "./pacingEngine";
import { checkContinuity, type ContinuityCheck } from "./continuityChecker";
import { adaptToPlatform, type PlatformAdaptationResult } from "./platformNarrativeAdapter";
import { checkNarrativeSafety, type NarrativeSafetyReport } from "./narrativeSafetyGuard";

export interface NarrativeGenerationInput extends StorySeedInput {
  sceneType?: string;
  location?: string;
  style?: string;
  pov?: "FIRST_PERSON" | "THIRD_PERSON_LIMITED" | "THIRD_PERSON_OMNISCIENT" | "SCRIPT";
  preferredStructure?: string;
  currentPhase?: string;
  targetWordCount?: number;
  subjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
  userLevel: "PLAIN_USER" | "STRUCTURED_USER" | "FOUNDER_TECHNICAL";
}

export interface NarrativeGenerationResult {
  modeResolution: NarrativeModeResolution;
  storySeed: StorySeed;
  plotStructure: PlotStructureResult;
  scene: SceneOutput;
  dialogue: DialogueResult;
  characterArc: CharacterArc;
  conflict: ConflictResult;
  pacing: PacingResult;
  continuity: ContinuityCheck;
  platformAdaptation?: PlatformAdaptationResult;
  safety: NarrativeSafetyReport;
}

export function generateNarrative(input: NarrativeGenerationInput): NarrativeGenerationResult {
  const modeResolution = resolveNarrativeMode({
    preferredMode: input.targetMode,
    targetPlatform: input.targetPlatform,
    premise: input.storyPremise,
  });
  const storySeed = buildStorySeed({ ...input, targetMode: modeResolution.recommendedMode });
  const plotStructure = buildPlotStructure({
    preferredStructure: input.preferredStructure,
    currentPhase: input.currentPhase,
    platform: input.targetPlatform,
  });
  const conflict = buildConflict({ premise: storySeed.centralConflict });
  const characterArc = buildCharacterArc({ characterName: storySeed.protagonist });
  const scene = generateScene({
    storySeed,
    sceneType: input.sceneType ?? "CONFRONTATION",
    characters: [storySeed.protagonist, ...(input.characterNames?.slice(1) ?? [])],
    location: input.location ?? "未命名场景",
    conflict: conflict.mainConflict,
    targetWordCount: input.targetWordCount,
    style: input.style ?? "克制",
    pov: input.pov,
  });
  const dialogue = generateDialogue({
    speakers: [storySeed.protagonist, input.characterNames?.[1] ?? "对话方"],
    conflict: conflict.mainConflict,
    style: input.style ?? "RESTRAINED",
  });
  const pacing = checkPacing({
    text: scene.text,
    hasConflictEarly: /冲突|压力|争论|裁决/.test(scene.text.slice(0, 300)),
    loreDensity: 0.2,
    dialogueRatio: 0.3,
  });
  const continuity = checkContinuity({
    currentText: scene.text,
    characterNames: input.characterNames,
    knownLoreTerms: input.existingLore ? input.existingLore.split(/[，,、\s]+/).filter(Boolean) : [],
  });
  const platformAdaptation = input.targetPlatform ? adaptToPlatform(input.targetPlatform) : undefined;
  const safety = checkNarrativeSafety(scene.text + "\n" + dialogue.dialogueLines.map(l => l.line).join("\n"), {
    platformClaimed: input.targetPlatform,
    platformConfigured: input.targetPlatform,
  });
  return { modeResolution, storySeed, plotStructure, scene, dialogue, characterArc, conflict, pacing, continuity, platformAdaptation, safety };
}
