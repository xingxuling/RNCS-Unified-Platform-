import type { WebCapabilityModel, WebCapabilityOutput, WebCapabilityQaResult } from "./aetherWebCapabilityModels";
import { WEB_CAPABILITY_QA_RULES } from "@/constants/web-capability/webCapabilityQaRules";

export function evaluateCapabilityQa(model: WebCapabilityModel, outputs: WebCapabilityOutput[], blocked: boolean): WebCapabilityQaResult {
  const warnings: WebCapabilityQaResult["warnings"] = [];
  if (blocked) {
    warnings.push({ ruleId: "CAP_QA_011", message: "Safety Guard 已阻断，标记为 BLOCK。", severity: "CRITICAL" });
    return { status: "BLOCK", warnings };
  }
  if (model.requiredKnowledgeSources.length === 0) warnings.push({ ruleId: "CAP_QA_002", message: "缺少领域知识来源。", severity: "HIGH" });
  if (outputs.length === 0) warnings.push({ ruleId: "CAP_QA_004", message: "未产出任何输出对象。", severity: "HIGH" });
  if (model.qaRules.length === 0) warnings.push({ ruleId: "CAP_QA_005", message: "未声明 QA 规则。", severity: "MEDIUM" });

  // 显式纳入 WEB_CAPABILITY_QA_RULES 中的关键规则提示
  const overclaim = outputs.some((o) => /保证|绝对|一定|权威/.test(o.summary));
  if (overclaim) warnings.push({ ruleId: "CAP_QA_006", message: "检测到过度承诺词。", severity: "HIGH" });

  const status: WebCapabilityQaResult["status"] = warnings.some((w) => w.severity === "CRITICAL") ? "BLOCK" : warnings.length > 0 ? "WARN" : "PASS";
  return { status, warnings };
}

export const ALL_QA_RULES = WEB_CAPABILITY_QA_RULES;
