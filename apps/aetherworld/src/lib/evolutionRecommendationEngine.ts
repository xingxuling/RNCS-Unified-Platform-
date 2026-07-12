// 进化推荐引擎 Evolution Recommendation Engine
import { planMutations } from "./evolutionMutationPlanner";
import { computeBioEvolution } from "./bioProductEvolutionEngine";
import type { EvolutionMutation } from "@/constants/evolutionMutationTypes";

export interface EvolutionRecommendation {
  mutation: EvolutionMutation;
  userFacingText: string;
  founderText: string;
  canApply: boolean;
}

export interface RecommendationResult {
  stage: string;
  stageName: string;
  score: number;
  recommendations: EvolutionRecommendation[];
  suggestCodeEvolution?: {
    feature: string;
    reason: string;
  };
}

export function generateRecommendations(): RecommendationResult {
  const bio = computeBioEvolution();
  const muts = planMutations();

  const recs: EvolutionRecommendation[] = muts.map(m => ({
    mutation: m,
    userFacingText: humanize(m),
    founderText: `${m.type} · risk=${m.riskLevel} · affects ${m.affectedModules.length} module(s)`,
    canApply: m.riskLevel !== "HIGH",
  }));

  // Suggest code evolution if certain patterns
  const worldUse = bio.topFeatures.find(f => f.moduleId.startsWith("/world") || f.moduleId.startsWith("/virtual"));
  let suggestCodeEvolution: RecommendationResult["suggestCodeEvolution"];
  if (worldUse && worldUse.affinity > 8) {
    suggestCodeEvolution = {
      feature: "World Map UI Upgrade",
      reason: "你长期使用虚拟世界生成，当前地图视图可考虑升级。可生成 Lovable 代码提示词。",
    };
  }

  return {
    stage: bio.stage.id,
    stageName: bio.stage.name,
    score: bio.score,
    recommendations: recs,
    suggestCodeEvolution,
  };
}

function humanize(m: EvolutionMutation): string {
  switch (m.type) {
    case "HOME_REORDER": return `建议调整首页顺序：${(m.afterState.topModules as string[] | undefined)?.slice(0, 3).join(" · ") ?? ""}`;
    case "MODULE_HIDE":  return `建议折叠不常用模块：${m.affectedModules.join("、")}`;
    case "MODULE_PIN":   return `建议固定常用模块：${m.affectedModules.join("、")}`;
    case "BEGINNER_TO_ADVANCED": return "建议切换到高级模式，解锁更多模块。";
    case "FEEDBACK_REMINDER_ADJUST": return "建议启用主动回验提醒，提高预测可靠度。";
    case "WORLD_MODE_PRIORITIZE": return "建议把世界生成默认模式升级为 Full。";
    case "PERSONAL_APP_PROFILE_UPDATE": return `识别到新的 App 原型，建议更新个人配置。`;
    default: return m.reason;
  }
}
