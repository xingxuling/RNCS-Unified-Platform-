// 数列预测引擎：编排器 + Chat 桥接
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";
import { encodeCurrentSequenceState } from "./sequenceStateEncoder";
import { extractPredictionVariables } from "./sequenceVariableExtractor";
import { planTrajectories } from "./sequenceTrajectoryPlanner";
import { resolveActionPermission } from "./sequenceActionPermissionEngine";
import { generateReviewNodes } from "./sequenceReviewNodeBuilder";
import { evaluatePredictionSafety, PREDICTION_DISCLAIMER } from "./sequencePredictionSafetyPolicy";
import type {
  PredictionTargetType, SequencePredictionRequest,
  SequencePredictionResult, PredictionHorizon,
} from "./sequencePredictionTypes";
import { newPredictionId } from "./sequencePredictionTypes";

// ============== 意图识别 ==============
const PREDICT_TRIGGERS: RegExp[] = [
  /预测一下/, /推演一下/, /用数列预测/, /数列预测/,
  /接下来.{0,4}(怎样|如何|会发生)/, /未来.{0,8}(怎样|风险|趋势|如何)/,
  /(7|14|30)\s*天.{0,8}(如何|预测|趋势)/, /3\s*个月.{0,8}(如何|预测)/,
  /当前状态/, /下一步该做什么/, /会不会成功/,
  /这个.{0,10}(项目|应用|计划).{0,8}(风险|前景|未来)/,
];

export function isPredictionIntent(input: string): boolean {
  return PREDICT_TRIGGERS.some((r) => r.test(input));
}

// ============== 目标识别 ==============
export function inferPredictionTarget(input: string): PredictionTargetType {
  if (/(番茄钟|todo|表单|web\s*app|网页应用|app)/i.test(input)) return "APP";
  if (/(代码|bug|patch|函数|静态检查)/i.test(input)) return "CODE_TASK";
  if (/(蓝天机|世界|阵营|文明|区域)/.test(input)) return "WORLD_OBJECT";
  if (/(歌|主题曲|配乐|曲)/.test(input)) return "MUSIC_OBJECT";
  if (/(社交|发布|公开|分享|动态)/.test(input)) return "SOCIAL_POST";
  if (/(日历|提醒|周期|定时)/.test(input)) return "CALENDAR_TASK";
  if (/(模型|provider|ollama|webllm|延迟|latency)/i.test(input)) return "MODEL_PROVIDER";
  if (/(商店|能力包|webxxm|插件)/i.test(input)) return "STORE_PACKAGE";
  if (/(工作区|object|对象)/i.test(input)) return "WORKSPACE_OBJECT";
  if (/(关系|人脉|联系人|朋友)/.test(input)) return "RELATIONSHIP";
  if (/(组织|公司|团队|部门)/.test(input)) return "ORGANIZATION";
  if (/(市场|赛道|行业)/.test(input)) return "MARKET";
  if (/(项目|aetherworld|系统)/i.test(input)) return "PROJECT";
  return "CUSTOM";
}

export function inferPredictionHorizon(input: string): PredictionHorizon {
  if (/(7\s*天|一周|本周)/.test(input)) return "SHORT";
  if (/(30\s*天|一个月|本月|14\s*天)/.test(input)) return "MID";
  if (/(季|3\s*个月|半年|长期)/.test(input)) return "LONG";
  if (/(战略|未来.{0,2}年|长期方向)/.test(input)) return "STRATEGIC";
  return "SHORT";
}

// ============== 运行 ==============
export interface RunPredictionInput {
  rawInput: string;
  fusion?: FusionRuntimeInfo;
  memoryUnitCount?: number;
  mslFrameCount?: number;
  valueEventCount?: number;
}

export function runSequencePrediction(input: RunPredictionInput): SequencePredictionResult {
  const targetType = inferPredictionTarget(input.rawInput);
  const horizon = inferPredictionHorizon(input.rawInput);

  const request: SequencePredictionRequest = {
    id: newPredictionId("PREQ"),
    targetType,
    rawInput: input.rawInput,
    horizon,
    useMemory: !!input.memoryUnitCount,
    useMsl: !!input.mslFrameCount,
    useCurrency: !!input.valueEventCount,
    useFusion: !!input.fusion,
    createdAt: new Date().toISOString(),
  };

  const safety = evaluatePredictionSafety(input.rawInput);
  const state = encodeCurrentSequenceState({ rawInput: input.rawInput, fusion: input.fusion });
  const variables = extractPredictionVariables({
    rawInput: input.rawInput,
    targetType,
    fusion: input.fusion,
    memoryUnitCount: input.memoryUnitCount,
    mslFrameCount: input.mslFrameCount,
    valueEventCount: input.valueEventCount,
  });
  const trajectories = planTrajectories({
    targetType,
    currentSequenceState: state.currentSequenceState,
    variables,
  });
  const permission = resolveActionPermission({
    targetType,
    rawInput: input.rawInput,
    variables,
    trajectories,
    safetyStatus: safety.status,
  });
  const reviewNodes = generateReviewNodes({ targetType, variables });

  // 置信度：结构化估算
  let confidence = 0.45;
  if (input.fusion) confidence += 0.15;
  if (input.memoryUnitCount && input.memoryUnitCount > 0) confidence += 0.1;
  if (input.mslFrameCount && input.mslFrameCount > 0) confidence += 0.05;
  if (input.valueEventCount && input.valueEventCount > 0) confidence += 0.05;
  if (state.isDefault) confidence -= 0.15;
  confidence = Math.max(0.2, Math.min(0.85, confidence));

  return {
    id: newPredictionId("PRES"),
    requestId: request.id,
    targetType,
    currentSequenceState: state.currentSequenceState,
    fiveDomainState: state.fiveDomainState,
    variables,
    trajectories,
    actionPermission: permission,
    reviewNodes,
    confidence,
    safetyStatus: safety.status,
    safetyNotes: [PREDICTION_DISCLAIMER, ...safety.notes, ...state.notes],
    referenceSummary: {
      memoryUnits: input.memoryUnitCount ?? 0,
      mslFrames: input.mslFrameCount ?? 0,
      valueEvents: input.valueEventCount ?? 0,
      fusionUsed: !!input.fusion,
    },
    generatedAt: new Date().toISOString(),
  };
}
