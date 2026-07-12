// 代码生成安全守护
import type { CodeGenerationInput } from "./codeGenerationCalculus";
import { scanCodeRisks } from "@/constants/codeSafetyRules";

export interface SafetyGuardInput {
  input: CodeGenerationInput;
  generatedPrompt: string;
}

export function runCodeSafetyGuard(g: SafetyGuardInput): string[] {
  const warns: string[] = [];
  if (g.input.doNotBreak.length === 0) {
    warns.push("[HIGH] 未声明 doNotBreak：建议至少包含 Demo/Real 隔离、Safety Boundary、Founder Mode。");
  }
  if (g.input.safetyLevel === "HIGH" && !g.generatedPrompt.includes("Safety Boundary")) {
    warns.push("[HIGH] 高安全级别任务，提示词未显式包含 Safety Boundary。");
  }
  if (g.input.targetFeature.length < 8) {
    warns.push("[MEDIUM] 目标功能描述过短，容易出现范围漂移。");
  }
  const risks = scanCodeRisks(g.input.targetFeature);
  for (const r of risks) {
    warns.push(`[${r.rule.severity}] ${r.rule.description}（命中：${r.matched}）`);
  }
  return warns;
}
