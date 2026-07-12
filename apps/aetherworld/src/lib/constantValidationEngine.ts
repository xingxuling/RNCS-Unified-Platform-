// 常数宇宙 v1.0 · 常数完整性校验（QA 可调用）
import { ConstantUniverse } from "./constantUniverseEngine";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ConstantValidationIssue {
  id: string;
  severity: Severity;
  group: string;
  message: string;
  hint?: string;
}

export function validateConstantUniverse(): ConstantValidationIssue[] {
  const issues: ConstantValidationIssue[] = [];

  // 数字 0-9 完整
  const digits = ConstantUniverse.numbers.map(n => n.digit).sort();
  for (let i = 0; i < 10; i++) {
    if (digits[i] !== i) {
      issues.push({ id: `NUMBER_MISSING_${i}`, severity: "CRITICAL", group: "NUMBER", message: `缺失数字常数 ${i}` });
    }
  }
  // 重复数字
  const seen = new Set<number>();
  for (const n of ConstantUniverse.numbers) {
    if (seen.has(n.digit)) {
      issues.push({ id: `NUMBER_DUP_${n.digit}`, severity: "HIGH", group: "NUMBER", message: `数字 ${n.digit} 存在重复定义` });
    }
    seen.add(n.digit);
  }

  // 五域必须 5 个
  if (ConstantUniverse.domains.length !== 5) {
    issues.push({ id: "DOMAIN_COUNT", severity: "CRITICAL", group: "FIVE_DOMAIN", message: "五域常数数量异常" });
  }

  // 回验常数必须存在
  if (ConstantUniverse.feedbackOutcomes.length === 0) {
    issues.push({ id: "FEEDBACK_EMPTY", severity: "CRITICAL", group: "FEEDBACK", message: "回验常数缺失" });
  }

  // 事件维度 15 个
  if (ConstantUniverse.eventDimensions.length < 15) {
    issues.push({ id: "EVENT_DIM_LOW", severity: "HIGH", group: "EVENT", message: "事件维度未达到 15 个" });
  }

  // 平台常数必须包含小红书
  if (!ConstantUniverse.platforms.find(p => p.id === "XIAOHONGSHU")) {
    issues.push({ id: "PLATFORM_NO_XHS", severity: "HIGH", group: "PLATFORM", message: "缺失小红书平台常数" });
  }

  // 物理现实常数 PLACEHOLDER 占比过高仅作为提示
  const placeholderCount = ConstantUniverse.physical.filter(p => p.status === "PLACEHOLDER").length;
  if (placeholderCount > 0) {
    issues.push({
      id: "PHYSICAL_PLACEHOLDER",
      severity: "LOW",
      group: "PHYSICAL",
      message: `物理现实常数中有 ${placeholderCount} 项仍为占位接口（Phase C）。`,
      hint: "UI 中已标注，不需立即修复。",
    });
  }

  return issues;
}
