import type { ActionPermissionResult } from "./actionPermissionResolver";
import type { ConstantGapResult } from "./constantGapDetector";
import type { ResistanceReductionResult } from "./resistanceReductionEngine";
import type { FiveDomainMapping } from "./fiveDomainMappingEngine";
import type { ObjectRecognitionResult } from "./objectRecognitionEngine";

export interface SolutionAction {
  actionName: string;
  why: string;
  how: string;
  priority: number;
  expectedSignal: string;
  risk: string;
}

export interface SolutionPath {
  problemRestatement: string;
  rootCause: string;
  currentStage: string;
  keyGap: string;
  topResistances: string[];
  recommendedActions: SolutionAction[];
  validationPlan: string[];
  nextReviewTime: string;
  immediate: SolutionAction[];
  shortTerm: SolutionAction[];
  midTerm: SolutionAction[];
}

export function generateSolutionPath(
  recog: ObjectRecognitionResult,
  domains: FiveDomainMapping,
  gaps: ConstantGapResult,
  resistance: ResistanceReductionResult,
  perm: ActionPermissionResult,
): SolutionPath {
  const top = resistance.topResistances.map((r) => r.resistance.userFriendlyName);
  const root = `${gaps.keyGap} + 阻力：${top.slice(0, 2).join("、") || "无明显阻力"}`;
  const stage = perm.riskLevel === "高" ? "高风险期：先稳住" : perm.riskLevel === "中" ? "调整期：低成本试" : "推进期：可小步前进";

  const immediate: SolutionAction[] = [
    {
      actionName: `今日：${perm.primaryAction}`,
      why: perm.reason,
      how: gaps.recommended补法[0] ?? "写一句最重要的事，今天只做这一件。",
      priority: 1,
      expectedSignal: "动作完成 + 情绪稳定",
      risk: perm.riskLevel,
    },
  ];

  const shortTerm: SolutionAction[] = (perm.secondaryActions.length ? perm.secondaryActions : ["回验","沟通"]).slice(0, 3).map((a, i) => ({
    actionName: `7日内：${a}`,
    why: `削减「${top[i] ?? "默认阻力"}」`,
    how: resistance.reductionPlan[i] ?? "拆成3小步，逐项完成。",
    priority: 2 + i,
    expectedSignal: "出现真实反馈/数据变化",
    risk: "中",
  }));

  const midTerm: SolutionAction[] = [
    {
      actionName: "2–6周：回验与重算",
      why: "把假设交回现实验证。",
      how: "收集真实信号，触发 Recalculation，必要时迭代解法。",
      priority: 99,
      expectedSignal: "出现稳定的可重复信号",
      risk: "低",
    },
  ];

  const all = [...immediate, ...shortTerm, ...midTerm];

  return {
    problemRestatement: recog.restatement,
    rootCause: root,
    currentStage: stage,
    keyGap: gaps.keyGap,
    topResistances: top,
    recommendedActions: all,
    validationPlan: gaps.recommended补法,
    nextReviewTime: perm.timing,
    immediate, shortTerm, midTerm,
  };
}
