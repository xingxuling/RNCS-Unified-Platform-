import type { UpgradeRecommendationType } from "@/constants/missing-layer/upgradeRecommendationTypes";
import type { MissingAbstractionResult } from "./missingAbstractionDetector";
import type { ReusePotentialScore } from "./reusePotentialScorer";
import type { FeatureFragmentationResult } from "./featureFragmentationDetector";
import type { RuntimeGapResult } from "./runtimeGapDetector";
import type { ObjectLayerGapResult } from "./objectLayerGapDetector";
import type { CrossFunctionalGapResult } from "./crossFunctionalGapDetector";
import type { GovernanceGapResult } from "./governanceGapDetector";
import type { UserUnderstandingGapResult } from "./userUnderstandingGapDetector";
import type { CommercialPresentationGapResult } from "./commercialPresentationGapDetector";
import type { OvergrowthRiskResult } from "./overgrowthRiskDetector";

export interface SystemUpgradeRecommendation {
  recommendationId: string;
  title: string;
  recommendationType: UpgradeRecommendationType;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  targetLayer: string;
  affectedModules: string[];
  reason: string;
  expectedSystemMultiplier: number;
  estimatedComplexity: "LOW" | "MEDIUM" | "HIGH";
  suggestedPromptType: "LOVABLE_PROMPT" | "CODEX_PROMPT" | "DOCS_UPDATE" | "QA_PASS" | "INTEGRATION_PASS";
  actionPlan: string[];
  shouldAddNewModule: boolean;
  shouldImproveExistingModule: boolean;
  shouldPauseExpansion: boolean;
}

export function planNextUpgrades(input: {
  abstraction?: MissingAbstractionResult;
  reuse?: ReusePotentialScore;
  fragmentation: FeatureFragmentationResult;
  runtime: RuntimeGapResult;
  objects: ObjectLayerGapResult;
  cross: CrossFunctionalGapResult;
  governance: GovernanceGapResult;
  understanding: UserUnderstandingGapResult;
  commercial: CommercialPresentationGapResult;
  overgrowth: OvergrowthRiskResult;
}): SystemUpgradeRecommendation[] {
  const recs: SystemUpgradeRecommendation[] = [];
  const id = () => `rec-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  if (input.overgrowth.overgrowthScore >= 80) {
    recs.push({
      recommendationId: id(),
      title: "暂停新增并整合现有系统",
      recommendationType: "PAUSE_AND_INTEGRATE",
      priority: "CRITICAL",
      targetLayer: "LIFECYCLE_LAYER",
      affectedModules: [],
      reason: `过度生长风险 ${input.overgrowth.overgrowthScore}: ${input.overgrowth.symptoms.join("; ")}`,
      expectedSystemMultiplier: 90,
      estimatedComplexity: "MEDIUM",
      suggestedPromptType: "INTEGRATION_PASS",
      actionPlan: ["停止新增功能", "整理现有模块", "补文档与展示", "提升 QA 覆盖"],
      shouldAddNewModule: false,
      shouldImproveExistingModule: true,
      shouldPauseExpansion: true,
    });
  }

  if (input.runtime.runtimeGapScore > 30) {
    recs.push({
      recommendationId: id(),
      title: "接入 Runtime Spine",
      recommendationType: "INTEGRATE_RUNTIME",
      priority: "HIGH",
      targetLayer: "RUNTIME_LAYER",
      affectedModules: input.runtime.modulesWithoutRuntime,
      reason: "核心功能未接入运行主干",
      expectedSystemMultiplier: 75,
      estimatedComplexity: "MEDIUM",
      suggestedPromptType: "INTEGRATION_PASS",
      actionPlan: input.runtime.recommendedRuntimeUpgrade,
      shouldAddNewModule: false,
      shouldImproveExistingModule: true,
      shouldPauseExpansion: false,
    });
  }

  if (input.objects.objectGapScore > 30) {
    recs.push({
      recommendationId: id(),
      title: "对象化未对象化的输出",
      recommendationType: "OBJECTIZE_OUTPUT",
      priority: "HIGH",
      targetLayer: "OBJECT_LAYER",
      affectedModules: input.objects.outputsNotObjectized,
      reason: "输出无法保存、跨域复用或导出",
      expectedSystemMultiplier: 80,
      estimatedComplexity: "MEDIUM",
      suggestedPromptType: "LOVABLE_PROMPT",
      actionPlan: input.objects.recommendedObjectization,
      shouldAddNewModule: false,
      shouldImproveExistingModule: true,
      shouldPauseExpansion: false,
    });
  }

  if (input.cross.bridgeGapScore > 20) {
    recs.push({
      recommendationId: id(),
      title: "桥接已有模块",
      recommendationType: "BRIDGE_EXISTING_MODULES",
      priority: "HIGH",
      targetLayer: "WORKFLOW_LAYER",
      affectedModules: input.cross.highValueBridgeCandidates,
      reason: "高价值跨域工作流缺桥",
      expectedSystemMultiplier: 78,
      estimatedComplexity: "LOW",
      suggestedPromptType: "INTEGRATION_PASS",
      actionPlan: input.cross.recommendedWorkflows,
      shouldAddNewModule: false,
      shouldImproveExistingModule: true,
      shouldPauseExpansion: false,
    });
  }

  if (input.understanding.understandingGapScore > 50) {
    recs.push({
      recommendationId: id(),
      title: "补文档与使用示例",
      recommendationType: "ADD_DOCS",
      priority: "MEDIUM",
      targetLayer: "DOCUMENTATION_LAYER",
      affectedModules: [],
      reason: "概念多但用户理解缺口大",
      expectedSystemMultiplier: 65,
      estimatedComplexity: "LOW",
      suggestedPromptType: "DOCS_UPDATE",
      actionPlan: input.understanding.recommendedDocs.slice(0, 6),
      shouldAddNewModule: false,
      shouldImproveExistingModule: true,
      shouldPauseExpansion: false,
    });
  }

  if (input.commercial.presentationGapScore > 50) {
    recs.push({
      recommendationId: id(),
      title: "补商业展示与演示路径",
      recommendationType: "ADD_DEMO_SHOWCASE",
      priority: "MEDIUM",
      targetLayer: "COMMERCIAL_LAYER",
      affectedModules: [],
      reason: "系统已具备能力但对外展示弱",
      expectedSystemMultiplier: 70,
      estimatedComplexity: "MEDIUM",
      suggestedPromptType: "LOVABLE_PROMPT",
      actionPlan: input.commercial.recommendedShowcaseUpgrade,
      shouldAddNewModule: true,
      shouldImproveExistingModule: false,
      shouldPauseExpansion: false,
    });
  }

  if (input.fragmentation.fragmentationScore > 70) {
    recs.push({
      recommendationId: id(),
      title: "整合重复与孤立模块",
      recommendationType: "PAUSE_AND_INTEGRATE",
      priority: "HIGH",
      targetLayer: "WORKFLOW_LAYER",
      affectedModules: input.fragmentation.isolatedModules,
      reason: `功能碎片化 ${input.fragmentation.fragmentationScore}`,
      expectedSystemMultiplier: 70,
      estimatedComplexity: "MEDIUM",
      suggestedPromptType: "INTEGRATION_PASS",
      actionPlan: [...input.fragmentation.suggestedMerges, ...input.fragmentation.suggestedBridges],
      shouldAddNewModule: false,
      shouldImproveExistingModule: true,
      shouldPauseExpansion: true,
    });
  }

  return recs.slice(0, 5);
}
