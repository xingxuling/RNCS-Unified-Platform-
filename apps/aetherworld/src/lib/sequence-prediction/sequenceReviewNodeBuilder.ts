// 复查节点生成
import type {
  PredictionTargetType, ReviewNode, PredictionVariables,
} from "./sequencePredictionTypes";
import { newPredictionId } from "./sequencePredictionTypes";

export interface ReviewInput {
  targetType: PredictionTargetType;
  variables: PredictionVariables;
}

const DEFAULT_NODES: { offset: string; label: string; reason: string }[] = [
  { offset: "+1d", label: "24 小时复查模型延迟与 fallback", reason: "短期可观测信号最直接。" },
  { offset: "+3d", label: "3 天后复查 Bug Audit", reason: "确认本轮改动未引入回归。" },
  { offset: "+7d", label: "7 天后复查工作区 / 记忆增长", reason: "中期看复用率是否上升。" },
  { offset: "+30d", label: "30 天后复查 Beta 完整度 / 价值账本", reason: "中期价值积累评估。" },
];

export function generateReviewNodes(input: ReviewInput): ReviewNode[] {
  const nodes: ReviewNode[] = DEFAULT_NODES.map((n) => ({
    id: newPredictionId("REV"),
    label: n.label,
    suggestedDateOffset: n.offset,
    reason: n.reason,
    calendarReady: true,
  }));

  // 目标专属
  if (input.targetType === "SOCIAL_POST") {
    nodes.push({
      id: newPredictionId("REV"),
      label: "发布前 QA 复检节点",
      suggestedDateOffset: "+0d",
      reason: "公开发布必须人工 QA 复检。",
      calendarReady: true,
    });
  }
  if (input.targetType === "MODEL_PROVIDER") {
    nodes.push({
      id: newPredictionId("REV"),
      label: "14 天后复查 Provider 切换策略",
      suggestedDateOffset: "+14d",
      reason: "评估本地 Ollama 与备用 Provider 的负载分担。",
      calendarReady: true,
    });
  }

  return nodes;
}
