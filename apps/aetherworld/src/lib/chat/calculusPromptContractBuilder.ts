// 根据 CalculusRoute 构造 Prompt Contract 与对应的 system prompt 片段。
import type { CalculusRoute, CalculusPromptContract } from "./calculusRouteResultTypes";
import { CALCULUS_LABEL } from "./calculusRouteResultTypes";
import { CALCULUS_REGISTRY, buildContractFromDefinition } from "./calculusRouteRegistry";

export function buildContractFromRoute(route: CalculusRoute): CalculusPromptContract | null {
  if (!route.calculusIds.length) return null;
  const defs = route.calculusIds.map((id) => CALCULUS_REGISTRY[id]);
  return buildContractFromDefinition(defs);
}

export function contractToSystemPrompt(contract: CalculusPromptContract): string {
  const lines: string[] = [];
  lines.push("【计算法 Contract】");
  lines.push(`领域：${contract.domain}`);
  lines.push(`命中计算法：${contract.calculusIds.map((id) => CALCULUS_LABEL[id]).join(" → ")}`);
  lines.push("");
  lines.push("回答必须尽量按以下结构组织（使用 Markdown 小标题）：");
  contract.requiredSections.forEach((s) => lines.push(`- ${s}`));
  lines.push("");
  lines.push("允许的输出对象类型（仅限以下取值）：");
  lines.push(contract.allowedOutputTypes.join(" / "));
  lines.push("");
  if (contract.forbiddenClaims.length) {
    lines.push("禁止行为：");
    contract.forbiddenClaims.forEach((c) => lines.push(`- ${c}`));
  }
  if (contract.qaRules.length) {
    lines.push("QA 规则：");
    contract.qaRules.forEach((c) => lines.push(`- ${c}`));
  }
  if (contract.suggestedTools.length) {
    lines.push("");
    lines.push("可选工具调用（如需调用，请在回答末尾追加一段独立的代码块，语言标为 `aether-tool`，内容为 JSON：{\"tool\":\"<工具名>\",\"args\":{...},\"reason\":\"...\"}）：");
    contract.suggestedTools.forEach((t) => lines.push(`- ${t}`));
    lines.push("如果不需要调用工具，省略该代码块即可。");
  }
  return lines.join("\n");
}
