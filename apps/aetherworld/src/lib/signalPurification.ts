// 信号净化引擎
import type { SignalTypeKey, ModelPermission } from "@/constants/signalTypes";
import { SIGNAL_TYPES } from "@/constants/signalTypes";
import { clamp } from "./math";

export interface SignalInput {
  repetition: number;     // 信号重复度 0-10
  crossDomain: number;    // 跨域一致性 0-10
  realityFeedback: number;// 现实反馈 0-10
  timeFit: number;        // 时间贴合 0-10
  mainlineRelevance: number; // 主线相关 0-10
  emotion: number;        // 情绪强度 0-10
  wish: number;           // 愿望污染 0-10
  fear: number;           // 恐惧污染 0-10
  externalNoise: number;  // 外界噪声 0-10
}

export interface SignalPurificationResult {
  score: number;          // 0-100
  level: "High" | "Medium" | "Low";
  type: SignalTypeKey;
  typeName: string;
  noiseSources: string[];
  permission: ModelPermission;
  validation: string;
  nextObservation: string;
  breakdown: { numerator: number; denominator: number };
}

const safe = (v: number) => Math.max(0.5, v);

export function purifySignal(i: SignalInput): SignalPurificationResult {
  const num = (i.repetition + 1) * (i.crossDomain + 1) * (i.realityFeedback + 1)
    * (i.timeFit + 1) * (i.mainlineRelevance + 1);
  const den = safe(i.emotion) * safe(i.wish) * safe(i.fear) * safe(i.externalNoise);
  const raw = Math.log10(num / den + 1) * 22; // 经验缩放
  const score = Math.round(clamp(raw, 0, 100));

  const noiseSources: string[] = [];
  if (i.emotion >= 6) noiseSources.push("情绪噪声");
  if (i.wish >= 6) noiseSources.push("愿望投射");
  if (i.fear >= 6) noiseSources.push("恐惧投射");
  if (i.externalNoise >= 6) noiseSources.push("外界噪声");
  if (i.realityFeedback <= 2) noiseSources.push("缺乏现实反馈");
  if (i.crossDomain <= 2) noiseSources.push("单域孤立信号");

  // 类型判断
  let type: SignalTypeKey = "true";
  if (score < 20) type = "empty";
  else if (i.wish >= 7 && i.realityFeedback <= 4) type = "wish";
  else if (i.fear >= 7) type = "fear";
  else if (i.emotion >= 7 && score < 60) type = "emotional";
  else if (i.repetition >= 6 && i.crossDomain <= 3) type = "false_sync";
  else if (i.realityFeedback <= 3 && i.timeFit <= 3) type = "delayed";
  else if (i.crossDomain <= 3 && i.mainlineRelevance <= 3 && i.realityFeedback >= 5) type = "reverse";

  const typeMeta = SIGNAL_TYPES.find((t) => t.key === type)!;

  const level: SignalPurificationResult["level"] =
    score >= 65 ? "High" : score >= 40 ? "Medium" : "Low";

  const permission: ModelPermission =
    score >= 60 && type === "true" ? "YES" :
    score >= 35 ? "CAUTION" : "NO";

  const validation =
    type === "true" ? "等待 1-2 个跨域现实反馈复合（人 + 制度 / 时间 + 资源）。" :
    type === "wish" ? "需要现实反馈，而不是更多想象。" :
    type === "fear" ? "用具体证据替代恐惧推演。" :
    type === "emotional" ? "等情绪稳定 24-72h 后再判断。" :
    type === "false_sync" ? "记录 3 次后看是否仍保持一致。" :
    type === "delayed" ? "区分这是新信号还是旧事件回声。" :
    type === "reverse" ? "在做承诺前确认表象背后是否阻断。" :
    "缺乏支撑，暂不入模。";

  const nextObservation =
    permission === "YES" ? "进入预测内核，继续抽散与折域。" :
    permission === "CAUTION" ? "仅作为旁证，加权 ≤ 30%。" :
    "本轮不进入模型，记录到回验。";

  return {
    score, level, type, typeName: typeMeta.name,
    noiseSources, permission, validation, nextObservation,
    breakdown: { numerator: +num.toFixed(0), denominator: +den.toFixed(2) },
  };
}

export const DEFAULT_SIGNAL_INPUT: SignalInput = {
  repetition: 5, crossDomain: 5, realityFeedback: 5, timeFit: 5, mainlineRelevance: 5,
  emotion: 3, wish: 3, fear: 3, externalNoise: 3,
};
