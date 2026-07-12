import type { GeneratedModelSchema } from "@/lib/model-generation/modelSchemaBuilder";
import { MODEL_SAFETY_RULES, MODEL_DISCLAIMER } from "@/constants/model-generation/modelSafetyRules";

export interface ModelSafetyIssue {
  ruleId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  suggestion: string;
}

export interface ModelSafetyReport {
  ok: boolean;
  issues: ModelSafetyIssue[];
  disclaimer: string[];
}

const ABSOLUTE_RE = /(绝对正确|无需验证|一定成功|保证商业成功|百分之百|100%\s*正确)/;

export function checkModelSafety(
  schema: GeneratedModelSchema,
  context: { subjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER"; userLevel: string },
): ModelSafetyReport {
  const issues: ModelSafetyIssue[] = [];

  const text = JSON.stringify(schema);
  if (ABSOLUTE_RE.test(text)) {
    issues.push({
      ruleId: "NO_ABSOLUTE",
      severity: "CRITICAL",
      message: "模型内容包含『绝对 / 无需验证 / 一定成功』等断言",
      suggestion: "改为『当前结构下的建议』并保留回验计划",
    });
  }
  if (!schema.validationPlan || schema.validationPlan.measurableSignals.length === 0) {
    issues.push({
      ruleId: "REQUIRE_VALIDATION",
      severity: "HIGH",
      message: "缺少有效的回验计划",
      suggestion: "补充 measurableSignals 与 successCriteria",
    });
  }
  if (context.subjectMode === "FULL_60" && !schema.safetyRules.some(r => /隐私|privacy/i.test(r))) {
    issues.push({
      ruleId: "FULL60_PRIVACY",
      severity: "HIGH",
      message: "Full 60 模式但未包含隐私提示",
      suggestion: "在 safetyRules 加入 Full 60 隐私说明",
    });
  }
  if (schema.fields.length > 60) {
    issues.push({
      ruleId: "NO_BLOAT",
      severity: "LOW",
      message: `字段数 ${schema.fields.length} 超过 60，可能膨胀`,
      suggestion: "拆分为子模型",
    });
  }
  schema.fields.forEach(f => {
    if (!f.fieldName || /^(data|info|stuff|thing|x|y)$/i.test(f.fieldName)) {
      issues.push({
        ruleId: "NAMING_CLARITY",
        severity: "MEDIUM",
        message: `字段命名模糊：${f.fieldName}`,
        suggestion: "重命名为具体语义",
      });
    }
  });

  return {
    ok: issues.every(i => i.severity !== "CRITICAL"),
    issues,
    disclaimer: MODEL_DISCLAIMER,
  };
}

export { MODEL_SAFETY_RULES };
