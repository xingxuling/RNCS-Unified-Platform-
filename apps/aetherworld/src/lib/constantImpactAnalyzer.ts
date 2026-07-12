// 常数宇宙 v1.0 · 影响分析
import { CONSTANT_GROUPS, type ConstantGroupId } from "@/constants/constantGroups";

export interface ConstantImpactReport {
  groupId: ConstantGroupId;
  affectedCalculi: string[];
  affectedEvents: boolean;
  requiresRecalculation: boolean;
  affectsAccuracy: boolean;
  affectsHistoricalFeedback: boolean;
  affectsPromptForge: boolean;
  staleModules: string[];
  warnings: string[];
}

const HIGH_RISK_GROUPS: ConstantGroupId[] = ["NUMBER","FIVE_DOMAIN","FEEDBACK","EVENT"];

export function analyzeImpact(groupId: ConstantGroupId): ConstantImpactReport {
  const meta = CONSTANT_GROUPS.find(g => g.id === groupId);
  const consumers = meta?.consumers ?? [];
  const isHigh = HIGH_RISK_GROUPS.includes(groupId);

  return {
    groupId,
    affectedCalculi: consumers,
    affectedEvents: ["NUMBER","FIVE_DOMAIN","EVENT","TIME_PHASE","OPERATOR"].includes(groupId),
    requiresRecalculation: isHigh,
    affectsAccuracy: groupId === "FEEDBACK" || isHigh,
    affectsHistoricalFeedback: groupId === "FEEDBACK",
    affectsPromptForge: ["NUMBER","USER","PLATFORM","EVENT"].includes(groupId),
    staleModules: isHigh
      ? ["PredictionDetail","TriggerCalendar","FeedbackWeight","AccuracyMetrics","Recalculation","SoftwareQA"]
      : ["Recalculation","SoftwareQA"],
    warnings: isHigh
      ? ["此修改属于高风险类型，建议先备份当前常数 JSON。", "完成后请触发全量重算。"]
      : ["修改后请触发受影响模块的重算。"],
  };
}
