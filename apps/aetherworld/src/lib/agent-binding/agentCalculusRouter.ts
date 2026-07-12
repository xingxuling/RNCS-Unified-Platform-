import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

export function resolveCalculusRoute(profile: AgentBindingProfile, taskHint?: string): { selected: string; chain: string[]; reason: string } {
  const r = profile.calculusRouting;
  const chain = Array.from(new Set([r.defaultCalculusId, ...r.requiredCalculusIds, ...r.allowedCalculusIds]));
  return {
    selected: r.defaultCalculusId,
    chain,
    reason: taskHint ? `基于任务提示「${taskHint}」与策略 ${r.routingPolicy} 选择默认计算法` : `策略 ${r.routingPolicy}，使用默认计算法`,
  };
}
