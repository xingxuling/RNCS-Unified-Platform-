// 世界法则生成器
import { WORLD_RULE_TYPES, type WorldRuleTypeId } from "@/constants/worldRuleTypes";
import { getNumberConstant } from "@/constants/numberConstants";
import type { WorldSeed } from "./worldSeedCompiler";

export interface WorldRule {
  ruleId: WorldRuleTypeId;
  ruleName: string;
  userFriendlyExplanation: string;
  technicalBasis: string;
  relatedConstants: string[];
  actionAdvice: string;
  encyclopediaRef?: string;
}

const ADVICE_BY_DOMAIN: Record<string, string> = {
  tian: "顺时机，不强行起手。",
  di: "先稳场域、再做承诺。",
  ren: "先确认关键人物的真实意愿。",
  shen: "用主线校准短期动作。",
  feng: "小步推进，频繁回验。",
};

export function generateWorldRules(seed: WorldSeed, dominantDomain: string): WorldRule[] {
  const top = getNumberConstant(seed.dominantNumber);
  return WORLD_RULE_TYPES.map((t): WorldRule => {
    const isDominant = t.domain === dominantDomain;
    const user = isDominant
      ? `这是你世界中最强的法则之一：${t.baseExplanation}当前更倾向于以「${top.userFriendlyName}」为核心展开。`
      : `${t.baseExplanation}当前不是主导法则，建议作为辅线观察。`;
    return {
      ruleId: t.id, ruleName: t.name,
      userFriendlyExplanation: user,
      technicalBasis: `domain=${t.domain} · dominantNumber=${seed.dominantNumber} · freq=${seed.digitFrequency[seed.dominantNumber]}`,
      relatedConstants: [`数字 ${seed.dominantNumber}`, `域 ${t.domain}`],
      actionAdvice: ADVICE_BY_DOMAIN[t.domain] ?? "观察一段时间再行动。",
      encyclopediaRef: t.encyclopediaRef,
    };
  });
}
