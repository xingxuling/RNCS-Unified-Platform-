// 项目融合 · Bug Audit Bridge（仅生成可读说明，不直接改 BUG_REPORT 模块）
import type { ProjectFusionResult, ProjectFusionPlan } from "./projectFusionTypes";

export function buildAuditNote(plan: ProjectFusionPlan, result: ProjectFusionResult): string {
  return [
    `[Project Fusion] ${plan.sourceProjectName}`,
    `· 类型：${plan.fusionType}`,
    `· 目标：${plan.targetSystems.join(" / ")}`,
    `· 风险：${plan.riskLevel}`,
    `· 状态：${result.status}`,
    plan.conflicts.length ? `· 冲突：${plan.conflicts.length} 条` : "· 冲突：无",
  ].join("\n");
}
