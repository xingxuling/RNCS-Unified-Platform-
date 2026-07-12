// 产品活性引擎
import { VITALITY_FACTORS, type VitalityFactorKey, type VitalityLevel } from "@/constants/productVitalityFactors";
import { clamp } from "./math";

export type VitalityScores = Record<VitalityFactorKey, number>; // 0-10

export interface ProductVitalityResult {
  score: number;         // 0-100
  level: VitalityLevel;
  topGrowth: VitalityFactorKey[];
  topBlock: VitalityFactorKey[];
  worthPursuing: boolean;
  nextActions: string[];
}

export function evaluateVitality(s: VitalityScores): ProductVitalityResult {
  let pos = 0, neg = 0;
  VITALITY_FACTORS.forEach((f) => {
    if (f.isCost) neg += s[f.key];
    else pos += s[f.key];
  });
  // 正向 9 项 × 10 = 90 上限，扣减 ops 最多 -10
  const raw = (pos / 90) * 100 - (neg / 10) * 12;
  const score = Math.round(clamp(raw + 8, 0, 100));

  const level: VitalityLevel =
    score >= 80 ? "High-Vitality" :
    score >= 65 ? "Active" :
    score >= 50 ? "Growing" :
    score >= 30 ? "Weak" : "Dormant";

  const positives = VITALITY_FACTORS.filter((f) => !f.isCost);
  const topGrowth = [...positives].sort((a, b) => s[b.key] - s[a.key]).slice(0, 3).map((f) => f.key);
  const topBlock = [...positives].sort((a, b) => s[a.key] - s[b.key]).slice(0, 3).map((f) => f.key);

  const worthPursuing = score >= 55;
  const nextActions: string[] = [];
  if (s.loop <= 4) nextActions.push("先建反馈闭环：让一次使用产生下一次使用的理由。");
  if (s.data <= 4) nextActions.push("加入数据沉淀点（回验 / 历史 / 个人模型）。");
  if (s.identity <= 4) nextActions.push("命名用户身份，绑定产品到自我叙事。");
  if (s.monetization <= 4) nextActions.push("明确一条最小付费路径。");
  if (s.ops >= 7) nextActions.push("拆解高维护模块，自动化或降配。");
  if (!nextActions.length) nextActions.push("围绕最强 3 项继续放大。");

  return { score, level, topGrowth, topBlock, worthPursuing, nextActions };
}

export const DEFAULT_VITALITY: VitalityScores = {
  pain: 8, frequency: 6, loop: 7, data: 7, identity: 8,
  monetization: 6, spread: 5, depth: 9, geoFit: 7, ops: 5,
};
