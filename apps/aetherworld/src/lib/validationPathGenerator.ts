import type { SolutionPath } from "./solutionPathGenerator";
import type { ObjectRecognitionResult } from "./objectRecognitionEngine";

export interface ValidationPath {
  successSignals: string[];
  partialSuccessSignals: string[];
  failureSignals: string[];
  falsePositiveSignals: string[];
  feedbackQuestions: string[];
  nextRecalculationTrigger: string;
}

export function generateValidationPath(recog: ObjectRecognitionResult, path: SolutionPath): ValidationPath {
  const obj = recog.objectType;
  const methods = obj.commonValidationMethods;
  return {
    successSignals: [
      `${methods[0] ?? "关键指标"}出现正向变化`,
      `${methods[1] ?? "真实反馈"}稳定出现`,
      "情绪/能量未恶化",
    ],
    partialSuccessSignals: [
      "出现部分指标改善但不稳定",
      "1–2个真实反馈，但样本不足",
    ],
    failureSignals: [
      `${methods[0] ?? "关键指标"}无变化或下降`,
      "出现新的阻力且无法削减",
      "原计划无法继续执行",
    ],
    falsePositiveSignals: [
      "只有点赞/客气评论，没有真实转化",
      "孤立来源的赞美，无独立印证",
      "情绪上升但数据未跟上",
    ],
    feedbackQuestions: [
      `针对：${path.keyGap}，是否在 7 天内出现真实反馈？`,
      "完成情况是否可被第三方独立确认？",
      "如果让一个新用户重做，是否仍能成立？",
    ],
    nextRecalculationTrigger: path.nextReviewTime + "，或出现失败信号时立即重算。",
  };
}
