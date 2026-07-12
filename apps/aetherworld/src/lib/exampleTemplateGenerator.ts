import { getScenario } from "@/constants/exampleScenarioTypes";
import type { UsageExample } from "./usageExampleCalculus";

export function generateInputTemplate(scenarioId: string, vars: Record<string, string> = {}): string {
  const s = getScenario(scenarioId);
  if (!s) return "";
  let out = s.bestInputTemplate;
  Object.entries(vars).forEach(([k, v]) => { out = out.replaceAll(`{${k}}`, v); });
  return out;
}

export function exampleToPrompt(e: UsageExample): string {
  return [
    `# ${e.title}`,
    `场景：${e.scenarioType} · 模块：${e.moduleId}`,
    ``,
    `## 输入`,
    e.exampleInput,
    ``,
    `## 期望输出`,
    e.exampleOutputSummary,
    ``,
    `## 下一步`,
    ...e.nextActions.map((a) => `- ${a}`),
    ``,
    `## 验证点`,
    e.validationPoint,
    e.safetyNote ? `\n## 安全\n${e.safetyNote}` : "",
  ].join("\n");
}
