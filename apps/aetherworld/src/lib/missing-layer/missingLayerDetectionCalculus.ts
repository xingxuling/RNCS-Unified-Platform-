import type { MissingLayerType } from "@/constants/missing-layer/missingLayerTypes";
import type { MissingLayerSeverity } from "@/constants/missing-layer/missingLayerSeverityLevels";
import { scanSystemCapabilities, type SystemCapabilityMap } from "./systemCapabilityScanner";
import { buildSystemLayerMap, type SystemLayerMap } from "./systemLayerMapEngine";
import { detectMissingAbstraction } from "./missingAbstractionDetector";
import { scoreReusePotential, type ReusePotentialScore } from "./reusePotentialScorer";
import { detectFeatureFragmentation, type FeatureFragmentationResult } from "./featureFragmentationDetector";
import { detectRuntimeGaps, type RuntimeGapResult } from "./runtimeGapDetector";
import { detectObjectLayerGaps, type ObjectLayerGapResult } from "./objectLayerGapDetector";
import { detectCrossFunctionalGaps, type CrossFunctionalGapResult } from "./crossFunctionalGapDetector";
import { detectGovernanceGaps, type GovernanceGapResult } from "./governanceGapDetector";
import { detectUserUnderstandingGaps, type UserUnderstandingGapResult } from "./userUnderstandingGapDetector";
import { detectCommercialPresentationGaps, type CommercialPresentationGapResult } from "./commercialPresentationGapDetector";
import { detectOvergrowthRisk, type OvergrowthRiskResult } from "./overgrowthRiskDetector";
import { planNextUpgrades, type SystemUpgradeRecommendation } from "./nextUpgradePlanner";
import { runMissingLayerSafetyGuard } from "./missingLayerSafetyGuard";

export interface MissingLayerIssue {
  issueId: string;
  missingLayerType: MissingLayerType;
  severity: MissingLayerSeverity;
  affectedModules: string[];
  explanation: string;
  suggestedFix: string;
}

export interface MissingLayerDetectionResult {
  scanId: string;
  systemCapabilityMap: SystemCapabilityMap;
  systemLayerMap: SystemLayerMap;
  missingLayers: MissingLayerIssue[];
  reusePotential: ReusePotentialScore;
  fragmentationResult: FeatureFragmentationResult;
  runtimeGapResult: RuntimeGapResult;
  objectLayerGapResult: ObjectLayerGapResult;
  crossFunctionalGapResult: CrossFunctionalGapResult;
  governanceGapResult: GovernanceGapResult;
  userUnderstandingGapResult: UserUnderstandingGapResult;
  commercialPresentationGapResult: CommercialPresentationGapResult;
  overgrowthRiskResult: OvergrowthRiskResult;
  recommendations: SystemUpgradeRecommendation[];
  finalDecision: string;
  safetyNotes: string[];
}

export function runMissingLayerDetection(): MissingLayerDetectionResult {
  const cap = scanSystemCapabilities();
  const layerMap = buildSystemLayerMap();
  const fragmentation = detectFeatureFragmentation();
  const runtime = detectRuntimeGaps();
  const objects = detectObjectLayerGaps();
  const cross = detectCrossFunctionalGaps();
  const governance = detectGovernanceGaps();
  const understanding = detectUserUnderstandingGaps();
  const commercial = detectCommercialPresentationGaps();
  const overgrowth = detectOvergrowthRisk();

  const reuse = scoreReusePotential({
    affectedExistingModules: cap.capabilities.slice(0, 8).map(c => c.moduleId),
    reusableOutputs: ["object", "trace", "report"],
    downstreamBenefits: ["Workspace", "CLM", "Cross-Functional", "Runtime"],
  });

  const issues: MissingLayerIssue[] = [];
  let i = 0;
  const mkId = () => `iss-${Date.now()}-${i++}`;

  for (const m of objects.outputsNotObjectized) {
    issues.push({ issueId: mkId(), missingLayerType: "MISSING_OBJECTIZATION", severity: "HIGH", affectedModules: [m], explanation: `${m} 输出未对象化`, suggestedFix: `定义 ${m.toUpperCase()}_OBJECT` });
  }
  for (const m of runtime.modulesWithoutRuntime) {
    issues.push({ issueId: mkId(), missingLayerType: "MISSING_RUNTIME", severity: "HIGH", affectedModules: [m], explanation: `${m} 未接入 Runtime`, suggestedFix: `接入 Runtime Spine` });
  }
  for (const b of cross.missingBridges) {
    issues.push({ issueId: mkId(), missingLayerType: "MISSING_CROSS_FUNCTIONAL_BRIDGE", severity: "MEDIUM", affectedModules: [b.sourceModule, b.targetModule], explanation: b.bridgeReason, suggestedFix: `新增 ${b.sourceModule} → ${b.targetModule} 桥` });
  }
  for (const m of understanding.missingTutorials.slice(0, 5)) {
    issues.push({ issueId: mkId(), missingLayerType: "MISSING_DOCUMENTATION", severity: "MEDIUM", affectedModules: [m], explanation: `缺教程 ${m}`, suggestedFix: `补 Quick Start` });
  }
  if (commercial.presentationGapScore > 50) {
    issues.push({ issueId: mkId(), missingLayerType: "MISSING_COMMERCIAL_SHOWCASE", severity: "HIGH", affectedModules: [], explanation: "缺商业展示路径", suggestedFix: "新增 Commercial Showcase 模块" });
  }
  if (overgrowth.riskLevel === "CRITICAL" || overgrowth.riskLevel === "HIGH") {
    issues.push({ issueId: mkId(), missingLayerType: "MISSING_LIFECYCLE_GOVERNANCE", severity: "CRITICAL", affectedModules: [], explanation: `过度生长 ${overgrowth.overgrowthScore}`, suggestedFix: "暂停新增并整合" });
  }

  const recommendations = planNextUpgrades({ reuse, fragmentation, runtime, objects, cross, governance, understanding, commercial, overgrowth });

  let finalDecision = "ADD_FEATURE";
  if (overgrowth.overgrowthScore >= 80) finalDecision = "PAUSE_AND_INTEGRATE";
  else if (runtime.runtimeGapScore > 50) finalDecision = "ADD_RUNTIME_INTEGRATION";
  else if (objects.objectGapScore > 50) finalDecision = "ADD_OBJECT_LAYER";
  else if (cross.bridgeGapScore > 40) finalDecision = "ADD_CROSS_FUNCTIONAL_BRIDGE";
  else if (commercial.presentationGapScore > 60) finalDecision = "ADD_DEMO_SHOWCASE";
  else if (understanding.understandingGapScore > 60) finalDecision = "ADD_DOCS_AND_EXAMPLES";

  const safety = runMissingLayerSafetyGuard(recommendations.map(r => ({ recommendationType: r.recommendationType, title: r.title })));

  return {
    scanId: `scan-${Date.now()}`,
    systemCapabilityMap: cap,
    systemLayerMap: layerMap,
    missingLayers: issues,
    reusePotential: reuse,
    fragmentationResult: fragmentation,
    runtimeGapResult: runtime,
    objectLayerGapResult: objects,
    crossFunctionalGapResult: cross,
    governanceGapResult: governance,
    userUnderstandingGapResult: understanding,
    commercialPresentationGapResult: commercial,
    overgrowthRiskResult: overgrowth,
    recommendations,
    finalDecision,
    safetyNotes: safety.notes,
  };
}

export const missingLayerMeta = {
  name: "Missing-Layer Detection Calculus",
  version: "1.0.0",
  description: "系统缺层识别计算法",
};

export { detectMissingAbstraction };
