// Calculus Chain Executor —— v0.1 仅做"声明式"执行：把链转为模型可读的执行说明，
// 真正的工具调用仍由 chatToolCallingRuntime 处理。这里不绕过 Permission Guard。
import type { CrossDomainCalculusChain } from "./fusionTypes";
import { CALCULUS_LABEL } from "@/lib/chat/calculusRouteResultTypes";

export function describeChainForPrompt(chain: CrossDomainCalculusChain): string {
  if (!chain.steps.length) return "";
  const lines: string[] = [];
  lines.push("【跨域计算法链】");
  lines.push(`链路：${chain.steps.map((s) => CALCULUS_LABEL[s.calculusId]).join(" → ")}`);
  lines.push(`理由：${chain.reason}`);
  lines.push(`正交注入：${chain.orthogonalInjections.join(" / ")}`);
  lines.push("回答时请按链路顺序组织结构小节，每个计算法对应一个标题。");
  return lines.join("\n");
}
