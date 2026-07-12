import type { WebLlmFallbackModeId } from "@/constants/webllm/webLlmFallbackModes";

export interface FallbackResult {
  fallbackMode: WebLlmFallbackModeId;
  rawText: string;
  notes: string[];
}

export function ruleOnlyFallback(taskType: string, userInput: string, reason: string): FallbackResult {
  return {
    fallbackMode: "RULE_ONLY",
    rawText: `【规则层输出 · ${taskType}】\n原因：${reason}\n用户输入：${userInput.slice(0, 200)}\n建议：使用计算法结构生成草案，并提交 QA。`,
    notes: ["WebLLM 已降级，输出来自规则层占位。"],
  };
}
