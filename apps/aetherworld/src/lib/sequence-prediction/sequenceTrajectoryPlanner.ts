// 轨迹规划：3-4 条 trajectory
import type {
  PredictionTargetType, PredictionVariables, SequenceTrajectory,
} from "./sequencePredictionTypes";
import { newPredictionId } from "./sequencePredictionTypes";

export interface TrajectoryInput {
  targetType: PredictionTargetType;
  currentSequenceState: string;
  variables: PredictionVariables;
}

function nextState(current: string, deltas: number[]): string {
  // 简单可读：对 5 位状态做有界加减
  const digits = current.split("").map((d) => parseInt(d, 10) || 5);
  return digits.map((d, i) => {
    const v = d + (deltas[i] ?? 0);
    return String(Math.min(9, Math.max(0, v)));
  }).join("");
}

export function planTrajectories(input: TrajectoryInput): SequenceTrajectory[] {
  const { variables, currentSequenceState } = input;

  const high: SequenceTrajectory = {
    id: newPredictionId("TRAJ"),
    label: "主链强化路径",
    probabilityBand: "HIGH",
    probabilityRange: "结构化估算 60–75%",
    description: "在现有主链路（Chat → Fusion → 计算法链）上继续叠加可观测指标与状态帧，系统稳定度与可解释性提升。",
    nextSequenceState: nextState(currentSequenceState, [0, +1, +1, 0, 0]),
    risks: variables.divisorVariables.length > 0
      ? variables.divisorVariables.slice(0, 2)
      : ["可能因细节累积导致开发节奏变慢"],
    opportunities: ["可观测性变强", "记忆 / 货币 / MSL 三层互相印证"],
    suggestedActions: ["继续按现有计算法链推进", "为本轮结果生成 MSL 状态帧"],
  };

  const mid: SequenceTrajectory = {
    id: newPredictionId("TRAJ"),
    label: "复杂度上升路径",
    probabilityBand: "MEDIUM",
    probabilityRange: "结构化估算 30–45%",
    description: "新增功能或第三方接入使依赖增多，测试与回归压力上升。",
    nextSequenceState: nextState(currentSequenceState, [0, -1, 0, 0, +1]),
    risks: ["桥接层过多", "类型 / 常数漂移", ...variables.riskVariables].slice(0, 4),
    opportunities: ["倒逼出统一常数与桥接层规范"],
    suggestedActions: ["先沉淀类型 / 常数 / 桥接层", "再开新模块"],
  };

  const low: SequenceTrajectory = {
    id: newPredictionId("TRAJ"),
    label: "低概率高影响路径",
    probabilityBand: "LOW_PROB_HIGH_IMPACT",
    probabilityRange: "结构化估算 5–15%，但影响大",
    description: "后端 / RLS / 模型 Provider / Secret Guard 出现阻断级问题。",
    nextSequenceState: nextState(currentSequenceState, [-1, -2, 0, -1, -1]),
    risks: [
      "模型 Provider 全部不可用",
      "Secret 误泄漏",
      "公开发布意外触发",
      ...variables.riskVariables,
    ].slice(0, 4),
    opportunities: ["倒逼真实灾备 / 回滚机制"],
    suggestedActions: ["提前演练 fallback", "保持 Secret Guard / QA 不可绕过"],
  };

  const trajectories: SequenceTrajectory[] = [high, mid, low];

  // 最优跃迁路径
  if (variables.leapVariables.length > 0) {
    trajectories.push({
      id: newPredictionId("TRAJ"),
      label: "最优跃迁路径",
      probabilityBand: "LOW",
      probabilityRange: "结构化估算 10–25%，需主动促成",
      description: "通过「数列记忆 + MSL 状态 + 价值账本 + 融合链」完成底层闭环，进入下一阶段。",
      nextSequenceState: nextState(currentSequenceState, [+1, +1, +1, +1, +1]),
      risks: ["需要主动投入资源进行整合"],
      opportunities: ["架构跃迁", "跨域复用提升"],
      suggestedActions: variables.leapVariables.slice(0, 3),
    });
  }

  return trajectories;
}
