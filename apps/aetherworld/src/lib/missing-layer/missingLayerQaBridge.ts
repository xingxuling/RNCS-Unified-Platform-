import type { SystemUpgradeRecommendation } from "./nextUpgradePlanner";

export function runMissingLayerQa(result: { recommendations: SystemUpgradeRecommendation[]; finalDecision: string }) {
  const issues: string[] = [];
  if (result.recommendations.length === 0) issues.push("未生成任何升级建议");
  if (!result.finalDecision) issues.push("缺少最终决策");
  return {
    passed: issues.length === 0,
    issues,
    checkedAt: new Date().toISOString(),
  };
}
