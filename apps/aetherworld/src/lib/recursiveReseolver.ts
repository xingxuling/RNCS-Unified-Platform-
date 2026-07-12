import type { ValidationPath } from "./validationPathGenerator";
import type { SolutionPath } from "./solutionPathGenerator";

export type RecursiveFailureType =
  | "WRONG_OBJECT" | "WRONG_STAGE" | "WRONG_GAP" | "WRONG_ACTION"
  | "FIELD_BLOCKED" | "HUMAN_VARIABLE_MISSING" | "RESOURCE_NOT_ENOUGH"
  | "NOISE_TOO_HIGH" | "TIMING_WRONG" | "EXTERNAL_RANDOMNESS";

export interface RecursiveResolveSuggestion {
  failureType: RecursiveFailureType;
  diagnosis: string;
  nextRoundAdjustments: string[];
  nextRoundInputs: string[];
}

const HINT: Record<RecursiveFailureType, RecursiveResolveSuggestion> = {
  WRONG_OBJECT: {
    failureType: "WRONG_OBJECT",
    diagnosis: "对象识别可能有误，问题本质不是当前类型。",
    nextRoundAdjustments: ["切换对象类型","用更具体的描述重写问题"],
    nextRoundInputs: ["改写问题首句","显式选择对象类型"],
  },
  WRONG_STAGE: {
    failureType: "WRONG_STAGE",
    diagnosis: "阶段判断错了，可能不是推进期。",
    nextRoundAdjustments: ["降到守/恢复","延后推进"],
    nextRoundInputs: ["补能量与资源现状"],
  },
  WRONG_GAP: {
    failureType: "WRONG_GAP",
    diagnosis: "真正的缺口可能在另一个常数。",
    nextRoundAdjustments: ["人工指定主要缺口","让系统重新检测"],
    nextRoundInputs: ["补一段近期事实"],
  },
  WRONG_ACTION: {
    failureType: "WRONG_ACTION",
    diagnosis: "行动许可与现实不符。",
    nextRoundAdjustments: ["改为更保守的动作","缩范围"],
    nextRoundInputs: ["写下被阻断的具体动作"],
  },
  FIELD_BLOCKED: {
    failureType: "FIELD_BLOCKED",
    diagnosis: "场域阻断超预期。",
    nextRoundAdjustments: ["换平台/渠道/形式"],
    nextRoundInputs: ["列举可替代场域"],
  },
  HUMAN_VARIABLE_MISSING: {
    failureType: "HUMAN_VARIABLE_MISSING",
    diagnosis: "关键人物未到位。",
    nextRoundAdjustments: ["补人/换合作者"],
    nextRoundInputs: ["写出关键人列表与状态"],
  },
  RESOURCE_NOT_ENOUGH: {
    failureType: "RESOURCE_NOT_ENOUGH",
    diagnosis: "资源低于阈值。",
    nextRoundAdjustments: ["缩 MVP","止损一项"],
    nextRoundInputs: ["列出当前资源清单"],
  },
  NOISE_TOO_HIGH: {
    failureType: "NOISE_TOO_HIGH",
    diagnosis: "噪声压过信号。",
    nextRoundAdjustments: ["降信源","隔离一周再判断"],
    nextRoundInputs: ["写出主要噪声来源"],
  },
  TIMING_WRONG: {
    failureType: "TIMING_WRONG",
    diagnosis: "时间窗口未到或已过。",
    nextRoundAdjustments: ["等待","选择新窗口"],
    nextRoundInputs: ["补外部时间线索"],
  },
  EXTERNAL_RANDOMNESS: {
    failureType: "EXTERNAL_RANDOMNESS",
    diagnosis: "外部随机性过强，单次结果可信度低。",
    nextRoundAdjustments: ["多轮重复","降单次押注"],
    nextRoundInputs: ["增加样本数"],
  },
};

export function recursiveResolve(path: SolutionPath, validation: ValidationPath, observedFailure?: RecursiveFailureType): RecursiveResolveSuggestion[] {
  if (observedFailure) return [HINT[observedFailure]];
  const guesses: RecursiveFailureType[] = [];
  if (path.topResistances.some((t) => t.includes("信息"))) guesses.push("WRONG_GAP");
  if (path.topResistances.some((t) => t.includes("身体") || t.includes("情绪"))) guesses.push("WRONG_STAGE");
  if (validation.failureSignals.length) guesses.push("NOISE_TOO_HIGH");
  if (guesses.length === 0) guesses.push("EXTERNAL_RANDOMNESS","WRONG_ACTION");
  return Array.from(new Set(guesses)).slice(0, 3).map((g) => HINT[g]);
}

export const ALL_FAILURE_TYPES = Object.keys(HINT) as RecursiveFailureType[];
