import { PLOT_STRUCTURES, getPlotStructure } from "@/constants/narrative/plotStructures";
import { STORY_PHASES } from "@/constants/narrative/storyPhases";

export interface PlotStructureResult {
  structureType: string;
  currentPhase: string;
  nextBeat: string;
  requiredSceneFunction: string;
  pacingAdvice: string;
  hookSuggestion: string;
}

export function buildPlotStructure(input: {
  preferredStructure?: string;
  currentPhase?: string;
  platform?: string;
}): PlotStructureResult {
  const structureId =
    input.preferredStructure ||
    (input.platform === "FANQIE" || input.platform === "QIDIAN" ? "WEBNOVEL_GOLDEN_THREE_CHAPTERS" : "THREE_ACT");
  const structure = getPlotStructure(structureId) ?? PLOT_STRUCTURES[0];
  const phaseId = input.currentPhase || "OPENING_HOOK";
  const phase = STORY_PHASES.find(p => p.id === phaseId) ?? STORY_PHASES[0];
  const beatIndex = Math.min(structure.beats.length - 1, Math.max(0, STORY_PHASES.findIndex(p => p.id === phaseId)));
  const nextBeat = structure.beats[Math.min(structure.beats.length - 1, beatIndex + 1)] ?? structure.beats[structure.beats.length - 1];
  return {
    structureType: structure.id,
    currentPhase: phase.id,
    nextBeat,
    requiredSceneFunction: phase.function,
    pacingAdvice: phase.conflictIntensity > 0.7 ? "保持高压，对白短促" : phase.conflictIntensity < 0.3 ? "允许缓冲，留白" : "推进与缓冲交替",
    hookSuggestion: `${phase.name} 阶段：${phase.readerExpectation}`,
  };
}

export { PLOT_STRUCTURES, STORY_PHASES };
