import type { CrossFunctionalWorkflow } from "./crossFunctionalWorkflowPlanner";
import type { CrossFunctionalOutput } from "./crossFunctionalOutputAdapter";
import type { MeaningDriftCheck } from "./crossFunctionalMeaningDriftDetector";
import { CROSS_FUNCTIONAL_ENGINE_PAIRS } from "@/constants/cross-functional/crossFunctionalEnginePairs";

export interface CrossFunctionalQaIssue {
  code: string;
  message: string;
  severity: "INFO" | "WARN" | "FAIL";
}

export interface CrossFunctionalQaResult {
  status: "PASS" | "WARN" | "FAIL";
  issues: CrossFunctionalQaIssue[];
  recommendedFixes: string[];
}

const ENGINE_SET = new Set([
  ...CROSS_FUNCTIONAL_ENGINE_PAIRS.flatMap((p) => [p.sourceEngine, p.targetEngine]),
  "narrative","vocal","model","code","translation","promptForge","world","worldKnowledge",
  "productEncyclopedia","learningDocs","msl","uiUpdate","multiverse","copy","softwareQA","versionLeap","workspace","decision","export",
]);

export function runCrossFunctionalQa(
  workflow: CrossFunctionalWorkflow,
  output: CrossFunctionalOutput,
  drift: MeaningDriftCheck,
): CrossFunctionalQaResult {
  const issues: CrossFunctionalQaIssue[] = [];
  for (const e of workflow.requiredEngines) {
    if (!ENGINE_SET.has(e)) issues.push({ code: "ENGINE_MISSING", message: `引擎未注册：${e}`, severity: "FAIL" });
  }
  if (workflow.steps.length === 0) issues.push({ code: "EMPTY_WORKFLOW", message: "工作流没有任何步骤", severity: "FAIL" });
  if (drift.driftLevel === "CRITICAL") issues.push({ code: "MEANING_DRIFT_CRITICAL", message: drift.driftReasons.join("；"), severity: "FAIL" });
  else if (drift.driftLevel === "HIGH") issues.push({ code: "MEANING_DRIFT_HIGH", message: drift.driftReasons.join("；"), severity: "WARN" });
  if (output.reusableAssets.length === 0) issues.push({ code: "NO_REUSABLE_ASSETS", message: "未生成可复用资产", severity: "WARN" });
  if (!output.workspaceSaveRecommended) issues.push({ code: "WORKSPACE_NOT_RECOMMENDED", message: "未推荐保存到 Workspace", severity: "INFO" });

  const status: CrossFunctionalQaResult["status"] = issues.some((i) => i.severity === "FAIL")
    ? "FAIL"
    : issues.some((i) => i.severity === "WARN")
    ? "WARN"
    : "PASS";

  return {
    status,
    issues,
    recommendedFixes: drift.suggestedFixes,
  };
}
