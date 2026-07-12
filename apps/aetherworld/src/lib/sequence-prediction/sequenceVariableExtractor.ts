// 变量提取：7 类
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";
import type { PredictionTargetType, PredictionVariables } from "./sequencePredictionTypes";

export interface VariableExtractionInput {
  rawInput: string;
  targetType: PredictionTargetType;
  fusion?: FusionRuntimeInfo;
  memoryUnitCount?: number;
  mslFrameCount?: number;
  valueEventCount?: number;
}

function uniqPush(arr: string[], v: string) {
  if (v && !arr.includes(v)) arr.push(v);
}

export function extractPredictionVariables(input: VariableExtractionInput): PredictionVariables {
  const v: PredictionVariables = {
    invariants: [],
    dynamicVariables: [],
    multiplierVariables: [],
    divisorVariables: [],
    riskVariables: [],
    windowVariables: [],
    leapVariables: [],
  };
  const text = input.rawInput;

  // 不变量：取决于 targetType
  switch (input.targetType) {
    case "APP":
    case "CODE_TASK":
      uniqPush(v.invariants, "TanStack Start + Tailwind 工程栈");
      uniqPush(v.invariants, "Secret Guard / QA 不可绕过");
      break;
    case "MODEL_PROVIDER":
      uniqPush(v.invariants, "本机 Ollama 主链路");
      uniqPush(v.invariants, "Sanitizer + Secret Guard 不可绕过");
      break;
    case "SOCIAL_POST":
      uniqPush(v.invariants, "默认 PRIVATE 草稿，禁止自动 PUBLIC");
      break;
    case "PROJECT":
    default:
      uniqPush(v.invariants, "Aetherworld 宪法与禁止条款");
      uniqPush(v.invariants, "Responsive Shell v1 不可破坏");
  }

  // 动态变量：来自 fusion / 文本
  if (input.fusion) {
    uniqPush(v.dynamicVariables, `引擎权重 Profile=${input.fusion.engineProfile.intentType}`);
    uniqPush(v.dynamicVariables,
      `主导域=${input.fusion.fiveDomain.dominantDomain}`);
    if (input.fusion.chain.steps.length > 0) {
      uniqPush(v.dynamicVariables, `计算法链长度=${input.fusion.chain.steps.length}`);
    }
  }
  if (/(用户|增长|留存|活跃)/.test(text)) uniqPush(v.dynamicVariables, "用户活跃度");
  if (/(模型|延迟|响应|provider|ollama)/i.test(text)) uniqPush(v.dynamicVariables, "模型延迟与可用性");

  // 乘法变量（放大收益）
  if (input.memoryUnitCount && input.memoryUnitCount > 0) {
    uniqPush(v.multiplierVariables, `数列记忆复用 (${input.memoryUnitCount} 条)`);
  }
  if (/(复用|跨域|融合|联动)/.test(text)) uniqPush(v.multiplierVariables, "跨域融合复用");
  if (input.fusion && input.fusion.conceptGraph?.nodes.length >= 4) {
    uniqPush(v.multiplierVariables, "WebLCM 概念图密度足够");
  }

  // 除法变量（稀释收益）
  if (/(复杂|混乱|分散|临时方案|hack)/.test(text)) uniqPush(v.divisorVariables, "架构复杂度上升");
  if (input.fusion?.drift && input.fusion.drift.severity !== "NONE") {
    uniqPush(v.divisorVariables, `常数漂移=${input.fusion.drift.severity}`);
  }

  // 风险变量
  if (/(安全|secret|密钥|脱敏|公开发布|rls|权限)/i.test(text)) {
    uniqPush(v.riskVariables, "权限 / 安全边界");
  }
  if (/(部署|上线|生产|prod|线上)/i.test(text)) uniqPush(v.riskVariables, "部署 / 生产稳定性");
  if (input.targetType === "SOCIAL_POST") uniqPush(v.riskVariables, "公开发布合规性");
  if (input.targetType === "MODEL_PROVIDER") uniqPush(v.riskVariables, "Fallback 频率");

  // 窗口变量
  if (/(7\s*天|一周|本周)/.test(text)) uniqPush(v.windowVariables, "7 天短期窗口");
  if (/(30\s*天|一个月|本月)/.test(text)) uniqPush(v.windowVariables, "30 天中期窗口");
  if (/(季|3\s*个月|半年|长期)/.test(text)) uniqPush(v.windowVariables, "中长期窗口");
  if (v.windowVariables.length === 0) uniqPush(v.windowVariables, "未指定窗口（默认短期）");

  // 跃迁变量
  if (input.memoryUnitCount && input.mslFrameCount && input.valueEventCount) {
    uniqPush(v.leapVariables, "记忆 + 状态 + 价值三层闭环可达");
  }
  if (/(重构|跃迁|跨域|质变|从.{0,3}到)/.test(text)) uniqPush(v.leapVariables, "跨域跃迁信号");

  return v;
}
