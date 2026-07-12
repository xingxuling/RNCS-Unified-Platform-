// 项目融合 · Bridge Planner
// 输入：候选 + 冲突清单 + 映射目标 → 输出 ProjectFusionPlan
import type {
  SameAccountProjectCandidate,
  ProjectFusionPlan,
  FusionType,
} from "./projectFusionTypes";
import { mapToTargetSystems } from "./projectFusionMapper";
import { detectConflicts } from "./projectFusionConflictDetector";

function chooseFusionType(c: SameAccountProjectCandidate, conflictCount: number): FusionType {
  if (c.riskLevel === "HIGH") return "FULL_BRIDGE_PLAN";
  if (conflictCount > 0) return "REFERENCE_ONLY";
  if (c.fusionRecommendation === "REFERENCE_ONLY") return "REFERENCE_ONLY";
  // 类型驱动
  switch (c.projectType) {
    case "AI Chat / Agent":
    case "World / Character / Narrative":
      return "RUNTIME_BRIDGE";
    case "Workspace / Project":
    case "Calendar / Scheduler":
    case "Store / Plugin / Capability":
      return "LOGIC_REUSE";
    case "Analytics / Dashboard":
    case "Record / Audit / Verification":
      return "DATA_MODEL_REUSE";
    default:
      return c.reusableComponents.length > 0 ? "COMPONENT_REUSE" : "UI_PATTERN_REUSE";
  }
}

function inferPriority(c: SameAccountProjectCandidate): "P0" | "P1" | "P2" | "P3" {
  if (c.riskLevel === "HIGH") return "P3";
  if (c.fusionRecommendation === "FUSE_NOW") return "P1";
  if (c.fusionRecommendation === "BRIDGE_LATER") return "P2";
  return "P3";
}

export function planFusion(c: SameAccountProjectCandidate): ProjectFusionPlan {
  const targets = mapToTargetSystems(c);
  const conflicts = detectConflicts(c);
  const fusionType = chooseFusionType(c, conflicts.length);

  const filesToCreate: string[] = [];
  const filesToModify: string[] = [];
  const steps: string[] = [];

  if (fusionType === "REFERENCE_ONLY") {
    steps.push("仅登记参考，不创建文件。");
  } else if (fusionType === "FULL_BRIDGE_PLAN") {
    steps.push("仅生成桥接计划，等待 Founder 确认。");
    steps.push("由 Scheduler 创建 PROJECT_FUSION 任务（WAITING_CONFIRMATION）。");
  } else {
    filesToCreate.push(`src/lib/project-fusion/bridges/${slug(c.projectName)}.bridge.ts`);
    steps.push(`分析「${c.projectName}」的可复用资产。`);
    steps.push(`映射到目标系统：${targets.join(" / ")}。`);
    steps.push("通过 Bridge 层调用，不直接覆盖现有模块。");
    steps.push("将结果写入 Record Center & Workspace（PROJECT_FUSION_REPORT）。");
  }

  return {
    id: `PFP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    sourceProjectId: c.id,
    sourceProjectName: c.projectName,
    targetSystems: targets,
    fusionType,
    filesToCreate,
    filesToModify,
    conflicts,
    safetyNotes: c.riskLevel === "HIGH"
      ? ["高风险项：禁止自动迁移 Auth / Payment / DB schema / 外部 API。"]
      : ["默认走 Bridge，不覆盖现有模块。"],
    steps,
    recommendedPriority: inferPriority(c),
    riskLevel: c.riskLevel,
    createdAt: new Date().toISOString(),
  };
}

function slug(s: string): string {
  return (s || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32) || "project";
}
