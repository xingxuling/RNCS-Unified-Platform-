// 事件阶段引擎
import type { TriggerResult } from "./predictionEngine";
import {
  EVENT_STAGES, type EventStage, type EventStageId, getStage, nextStage,
} from "@/constants/eventStages";

export interface StageEvaluation {
  current: EventStage;
  next: EventStage;
  score: number;
  recommendation: string;
  actionable: boolean;
  validatable: boolean;
}

interface Ctx {
  trigger: TriggerResult;
  determinationScore?: number; // 0-100
  branchCollapseScore?: number;
  feedbackWeight?: number;
  humanVariableReady?: boolean;
  fieldSupport?: number; // 0-100
  noise?: number;
  blockingFactors?: number;
  polarity?: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";
}

export function evaluateStage(ctx: Ctx): StageEvaluation {
  const {
    trigger, determinationScore = 50, branchCollapseScore = 50,
    feedbackWeight = 50, humanVariableReady = true, fieldSupport = 60,
    noise = (trigger.noiseCandidates?.length ?? 0) * 10,
    blockingFactors = 0,
    polarity = "POSITIVE",
  } = ctx;

  const positive =
    trigger.score * 0.4
    + branchCollapseScore * 0.2
    + determinationScore * 0.2
    + feedbackWeight * 0.1
    + (humanVariableReady ? 10 : 0)
    + fieldSupport * 0.1;

  const negative = noise + blockingFactors * 15;
  const score = Math.max(0, Math.min(100, Math.round(positive - negative)));

  let currentId: EventStageId;
  if (polarity === "NEGATIVE" && noise > 35) currentId = "BLOCKED";
  else if (polarity === "NEGATIVE" && score > 60) currentId = "REVERSED";
  else if (score >= 90) currentId = "PEAKING";
  else if (score >= 80) currentId = "CONFIRMING";
  else if (score >= 65) currentId = "ESCALATING";
  else if (score >= 50) currentId = "TRIGGERED";
  else if (score >= 35) currentId = "FORMING";
  else if (score >= 20) currentId = "SEED";
  else currentId = "DECLINING";

  const current = getStage(currentId);
  const next = nextStage(currentId);

  const recommendation =
    currentId === "SEED" ? "观察 · 不要扩大行动" :
    currentId === "FORMING" ? "补材料 / 整理结构 / 准备" :
    currentId === "TRIGGERED" ? "小步行动 · 留回验入口" :
    currentId === "ESCALATING" ? "推进 / 沟通 / 提交" :
    currentId === "CONFIRMING" ? "确认 / 签约 / 发布 / 回验" :
    currentId === "PEAKING" ? "关键动作 · 不要错过窗口" :
    currentId === "DECLINING" ? "收尾 · 转入回验" :
    currentId === "BLOCKED" ? "降载 / 修复阻断 / 改路径" :
    currentId === "REVERSED" ? "止损 / 重构 / 转向" :
    "归档 · 进入回验复盘";

  return {
    current, next, score, recommendation,
    actionable: current.actionable,
    validatable: current.validatable,
  };
}

export { EVENT_STAGES };
