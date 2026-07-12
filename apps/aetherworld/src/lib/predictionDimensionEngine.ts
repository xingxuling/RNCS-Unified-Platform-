// 预测维度权重引擎 — 根据触发结果与主体推断当前主/副维度
import type { TriggerResult } from "./predictionEngine";
import type { SubjectModel } from "./types";
import {
  PREDICTION_DIMENSIONS, type PredictionDimensionId, type PredictionDimension,
} from "@/constants/predictionDimensions";

export interface DimensionResult {
  dimensionId: PredictionDimensionId;
  dimension: PredictionDimension;
  dimensionWeight: number; // 0-100
  confidence: number;      // 0-100
  reason: string;
  relatedSignals: string[];
  suggestedEvents: string[];
}

export interface DimensionRanking {
  primary: DimensionResult;
  secondary: DimensionResult[];
  all: DimensionResult[];
}

interface Context {
  subject: SubjectModel | null;
  trigger: TriggerResult;
  focusHint?: string[];      // 主体 focuses
  pageContext?: string;      // e.g. "prompt-forge"
}

function digitFrequency(subject: SubjectModel | null): Record<number, number> {
  const freq: Record<number, number> = {};
  for (let i = 0; i < 10; i++) freq[i] = 0;
  subject?.digits.flat().forEach((d) => { freq[d] = (freq[d] ?? 0) + 1; });
  return freq;
}

export function computeDimensionRanking(ctx: Context): DimensionRanking {
  const { subject, trigger, focusHint = [], pageContext = "" } = ctx;
  const freq = digitFrequency(subject);
  const totalDigits = Math.max(1, Object.values(freq).reduce((a, b) => a + b, 0));

  const results: DimensionResult[] = PREDICTION_DIMENSIONS.map((dim) => {
    let score = 30; // 基础分
    const reasons: string[] = [];
    const signals: string[] = [];

    // 数列关联数字贡献
    const numShare = dim.relatedNumbers.reduce((s, n) => s + (freq[n] ?? 0), 0) / totalDigits;
    if (numShare > 0) {
      const add = Math.round(numShare * 60);
      score += add;
      if (add >= 8) reasons.push(`数列高频含 ${dim.relatedNumbers.join("/")}`);
    }

    // 五域贡献
    const domainShare = dim.relatedDomains.reduce(
      (s, d) => s + ((trigger.domainScores as any)[d] ?? 0), 0,
    ) / (dim.relatedDomains.length * 100);
    const dAdd = Math.round(domainShare * 40);
    score += dAdd;
    if (dAdd >= 12) reasons.push(`五域 ${dim.relatedDomains.join("/")} 高位`);

    // 主导域加权
    if (dim.relatedDomains.includes(trigger.dominantDomain)) {
      score += 10;
      reasons.push(`主导域=${trigger.dominantDomain}`);
    }

    // 用户关注点
    focusHint.forEach((f) => {
      if (dim.name.includes(f) || dim.description.includes(f)) {
        score += 8;
        reasons.push(`关注点：${f}`);
      }
    });

    // 页面上下文
    if (pageContext) {
      if (pageContext.includes("prompt") && (dim.id === "PROMPT_TOOLING" || dim.id === "PRODUCT")) {
        score += 12; reasons.push("当前在 Prompt Forge");
      }
      if (pageContext.includes("real-subject") && (dim.id === "IDENTITY" || dim.id === "SPIRIT_MAINLINE")) {
        score += 8; reasons.push("Full 60 真实主体");
      }
      if (pageContext.includes("vitality") && dim.id === "PRODUCT") {
        score += 10; reasons.push("产品活性页");
      }
    }

    // 触发强度加成
    if (trigger.level === "peak") score += 6;
    else if (trigger.level === "high") score += 3;

    // 风险维度仅在噪声多时上升
    if (dim.id === "RISK_CHAOS") {
      score -= 15;
      if ((trigger.noiseCandidates?.length ?? 0) >= 2) {
        score += 25;
        reasons.push("噪声候选 ≥2");
        signals.push(...(trigger.noiseCandidates ?? []));
      }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      dimensionId: dim.id,
      dimension: dim,
      dimensionWeight: score,
      confidence: Math.min(100, Math.round(score * 0.85 + (numShare * 100) * 0.15)),
      reason: reasons.join(" · ") || "基础维度评估",
      relatedSignals: signals.length ? signals : dim.validationSignals.slice(0, 2),
      suggestedEvents: dim.defaultEventTypes,
    };
  });

  results.sort((a, b) => b.dimensionWeight - a.dimensionWeight);

  return {
    primary: results[0],
    secondary: results.slice(1, 3),
    all: results,
  };
}
