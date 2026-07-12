// Sequence Agent 评审桥接（容错调用；缺失模块不报错）
import type { ImaginativeFusionIdea } from "./imaginativeFusionTypes";

export interface AgentReviewNote {
  agent: "PRODUCT" | "ARCHITECT" | "CODE" | "SECURITY" | "ANALYTICS" | "COORDINATOR";
  comment: string;
}

export function buildAgentReview(idea: ImaginativeFusionIdea): AgentReviewNote[] {
  return [
    { agent: "PRODUCT",   comment: `产品价值 ${idea.potentialValue}/10：${idea.cnTitle} 是否解决真实场景需要验证。` },
    { agent: "ARCHITECT", comment: `主线契合 ${idea.strategicFit}/10，建议接入：${idea.targetAetherSystems.join(" / ")}。` },
    { agent: "CODE",      comment: `实现难度 ${idea.implementationDifficulty}/10：建议先做最小桥接，再逐步落地。` },
    { agent: "SECURITY",  comment: `风险等级 ${idea.riskLevel}：禁止自动迁移 Auth / Payment / DB schema。` },
    { agent: "ANALYTICS", comment: `新颖度 ${idea.novelty}/10，未来指标可关注：使用次数 / 留存 / 转化。` },
    { agent: "COORDINATOR", comment: `建议优先级 ${idea.recommendedPriority}，下一步：${idea.suggestedNextStep}。` },
  ];
}
