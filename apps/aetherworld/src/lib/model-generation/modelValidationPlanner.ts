import type { ModelTypeDefinition } from "@/constants/model-generation/modelTypes";

export interface ModelValidationPlan {
  validationGoal: string;
  measurableSignals: string[];
  feedbackFields: string[];
  successCriteria: string[];
  failureSignals: string[];
  recalculationTriggers: string[];
}

export function planValidation(
  input: { objectName: string; targetUse: string; modelType: string },
  def?: ModelTypeDefinition,
): ModelValidationPlan {
  const base: ModelValidationPlan = {
    validationGoal: `验证 ${input.objectName || input.modelType} 是否能在目标用途中成立：${input.targetUse || "未填"}`,
    measurableSignals: ["真实使用反馈", "字段命中率", "用户理解度"],
    feedbackFields: def?.validationFields ?? ["outputs"],
    successCriteria: ["关键字段被真实数据填充", "回验信号收敛", "无安全告警"],
    failureSignals: ["字段长期为空", "用户反馈无法理解", "出现安全违规"],
    recalculationTriggers: ["源输入变化", "模型类型变化", "Safety Rules 更新", "MSL opcode 更新", "activeSubjectProfile 更新"],
  };
  if (input.modelType === "PRODUCT_MODEL") {
    base.measurableSignals.push("注册转化率", "留存率", "付费转化率");
    base.failureSignals.push("阅读量不动", "有点赞无收藏", "用户仍看不懂产品");
  }
  if (input.modelType === "EVENT_MODEL") {
    base.measurableSignals.push("阅读量", "点赞率", "收藏率", "评论率", "主页点击", "关注转化", "停留时间");
  }
  if (input.modelType === "VOCAL_MODEL") {
    base.measurableSignals.push("音域达标", "情绪还原", "嗓音无损伤");
  }
  return base;
}
