// 当前状态数列化：5 位 0-9 编码，对应 天/地/人/神/风
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";
import type { FiveDomainState } from "./sequencePredictionTypes";

type Dom = "HEAVEN" | "EARTH" | "HUMAN" | "SPIRIT" | "WIND";

function scoreFromFusion(fusion: FusionRuntimeInfo | undefined, dom: Dom): number {
  // 默认 5（均衡）
  if (!fusion) return 5;
  const c = fusion.fiveDomain.coordinates.find((x) => x.domain === dom);
  if (!c) return 5;
  // weight 0~1 → 1~9 区间
  const raw = Math.round(1 + c.weight * 8);
  return Math.min(9, Math.max(0, raw));
}

const DEFAULT_EXPLANATION: Record<Dom, string> = {
  HEAVEN: "外部趋势 / 时机窗口",
  EARTH: "资源 / 承载 / 环境",
  HUMAN: "执行主体 / 用户 / 团队",
  SPIRIT: "叙事 / 规则 / 意义 / 合法性",
  WIND: "传播 / 流动 / 接口 / 机会窗口",
};

export interface StateEncodingInput {
  rawInput: string;
  fusion?: FusionRuntimeInfo;
}

export interface StateEncodingOutput {
  currentSequenceState: string; // e.g. "86785"
  fiveDomainState: FiveDomainState;
  isDefault: boolean;
  notes: string[];
}

export function encodeCurrentSequenceState(input: StateEncodingInput): StateEncodingOutput {
  const notes: string[] = [];
  const useDefault = !input.fusion;
  if (useDefault) notes.push("无可用融合上下文，使用默认均衡估算 55555。");

  const heaven = scoreFromFusion(input.fusion, "HEAVEN");
  const earth = scoreFromFusion(input.fusion, "EARTH");
  const human = scoreFromFusion(input.fusion, "HUMAN");
  const spirit = scoreFromFusion(input.fusion, "SPIRIT");
  const wind = scoreFromFusion(input.fusion, "WIND");

  const exp: Record<string, string> = {};
  for (const c of input.fusion?.fiveDomain.coordinates ?? []) {
    exp[c.domain] = c.interpretation || c.label;
  }
  // 补充默认解释
  for (const dom of Object.keys(DEFAULT_EXPLANATION) as Dom[]) {
    if (!exp[dom]) exp[dom] = DEFAULT_EXPLANATION[dom];
  }

  return {
    currentSequenceState: useDefault
      ? "55555"
      : `${heaven}${earth}${human}${spirit}${wind}`,
    fiveDomainState: {
      heaven, earth, human, spirit, wind, explanation: exp,
    },
    isDefault: useDefault,
    notes,
  };
}
