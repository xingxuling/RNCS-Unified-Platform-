import { FORBIDDEN_PHRASES, EXAMPLE_SAFETY_RULES } from "@/constants/exampleSafetyRules";
import type { UsageExample } from "./usageExampleCalculus";

export interface GuardResult {
  ok: boolean;
  violations: string[];
  warnings: string[];
}

export function guardExample(e: UsageExample): GuardResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  const text = `${e.title} ${e.exampleInput} ${e.exampleOutputSummary} ${(e.exampleOutputDetailed ?? "")}`;
  FORBIDDEN_PHRASES.forEach((p) => { if (text.includes(p)) violations.push(`含禁词：${p}`); });
  if (e.nextActions.length === 0) warnings.push("缺少下一步动作");
  if (!e.validationPoint) warnings.push("缺少验证点");
  if (/Full\s*60/i.test(e.exampleInput) && !(e.safetyNote ?? "").includes("本地")) {
    warnings.push("Full 60 示例应提示本地保存与隐私");
  }
  return { ok: violations.length === 0, violations, warnings };
}

export { EXAMPLE_SAFETY_RULES };
