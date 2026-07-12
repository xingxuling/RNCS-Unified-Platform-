import type { AppFeature, AppRequirementObject } from "./appProjectObjectEngine";
import type { AppIdeaInput } from "./appIdeaNormalizer";
import type { AppIntentResult } from "./appIntentClassifier";

export function generateAppRequirement(
  projectId: string,
  idea: AppIdeaInput,
  intent: AppIntentResult,
): AppRequirementObject {
  const features: AppFeature[] = (idea.desiredFeatures || []).slice(0, 5).map((title, i) => ({
    featureId: `feat-${i + 1}`,
    title,
    description: `${title} —— 由 Digital Product Manager 基于用户输入推断。`,
    priority: i === 0 ? "MUST" : i < 3 ? "SHOULD" : "COULD",
    userValue: `让用户能够：${title}`,
    acceptanceCriteria: [
      `用户可在主界面看到「${title}」入口`,
      `用户操作「${title}」时有明确反馈`,
      `失败 / 空状态有清晰提示`,
    ],
  }));

  return {
    requirementId: `req-${projectId}`,
    projectId,
    productSummary: `${idea.appNameSuggestion}：${idea.problemStatement}`,
    targetUsers: idea.targetUsers || ["通用用户"],
    userStories: features.map(f => `作为目标用户，我希望可以${f.title}，以便${f.userValue}。`),
    mvpFeatures: features,
    nonGoals: [
      "不做用户登录与账户系统",
      "不做云同步与多端持久化",
      "不做支付与订阅",
      "不做复杂统计与数据分析",
      ...(intent.riskLevel === "HIGH" ? ["不接入真实外部 API"] : []),
    ],
    acceptanceCriteria: features.flatMap(f => f.acceptanceCriteria),
    constraints: idea.constraints || [],
  };
}
