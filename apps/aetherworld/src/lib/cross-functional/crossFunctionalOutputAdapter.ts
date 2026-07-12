import type { CrossFunctionalWorkflow } from "./crossFunctionalWorkflowPlanner";
import type { CrossFunctionalOutputType } from "@/constants/cross-functional/crossFunctionalOutputProfiles";

export interface EngineOutputSummary {
  engineId: string;
  outputSummary: string;
  reusableParts: string[];
  warnings: string[];
}

export interface ReusableAsset {
  assetId: string;
  assetType: string;
  title: string;
  contentPreview: string;
  reusableIn: string[];
}

export interface CrossFunctionalOutput {
  outputId: string;
  workflowId: string;
  outputType: CrossFunctionalOutputType;
  title: string;
  summary: string;
  engineOutputs: EngineOutputSummary[];
  reusableAssets: ReusableAsset[];
  nextPossibleEngines: string[];
  workspaceSaveRecommended: boolean;
  safetyNotes: string[];
}

const TYPE_MAP: Record<string, CrossFunctionalOutputType> = {
  CHARACTER_ASSET_PACK: "CHARACTER_ASSET_PACK",
  WORLD_ASSET_PACK: "WORLD_ASSET_PACK",
  SONG_PRODUCTION_PACK: "SONG_ASSET_PACK",
  PRODUCT_BUILD_PACK: "PRODUCT_BUILD_PACK",
  SEQUENCE_CREATION_PACK: "WORKSPACE_OBJECT_PACK",
};

export function buildCrossFunctionalOutput(workflow: CrossFunctionalWorkflow): CrossFunctionalOutput {
  const engineOutputs: EngineOutputSummary[] = workflow.steps.map((s) => ({
    engineId: s.engineId,
    outputSummary: s.outputSummary,
    reusableParts: [s.outputSummary],
    warnings: [],
  }));
  const reusableAssets: ReusableAsset[] = workflow.steps.slice(0, 6).map((s, i) => ({
    assetId: `asset_${i}`,
    assetType: s.engineId,
    title: `${s.stepName} 资产`,
    contentPreview: `${workflow.inputObject.objectType} → ${s.outputSummary}`,
    reusableIn: ["workspace", "promptForge", "learningDocs"],
  }));
  return {
    outputId: `cfo_${Date.now().toString(36)}`,
    workflowId: workflow.workflowId,
    outputType: TYPE_MAP[workflow.workflowType] ?? "WORKSPACE_OBJECT_PACK",
    title: workflow.title,
    summary: `${workflow.inputObject.objectName ?? workflow.inputObject.objectType} 经 ${workflow.steps.length} 步跨域生成`,
    engineOutputs,
    reusableAssets,
    nextPossibleEngines: ["workspace", "translation", "promptForge"],
    workspaceSaveRecommended: true,
    safetyNotes: ["Demo / Real 隔离", "Founder-only 不外泄", "数列货币 ≠ 现实金融"],
  };
}
