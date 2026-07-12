// 折域计算引擎
import { FOLD_DOMAINS, type FoldDomainKey } from "@/constants/domainFactors";
import { clamp } from "./math";

export type DomainScoresMap = Record<FoldDomainKey, number>; // 0-100

export interface DomainFoldingResult {
  index: number;           // 0-100
  aligned: FoldDomainKey[];
  conflicting: FoldDomainKey[];
  missing: FoldDomainKey[];
  scores: DomainScoresMap;
  verdict: string;
}

export function foldDomains(scores: DomainScoresMap, mainlineWeight = 1): DomainFoldingResult {
  // 正向均分（去掉 noise）
  const positive = FOLD_DOMAINS.filter((d) => !d.isNegative);
  const posVals = positive.map((d) => scores[d.key] ?? 0);
  const avgPos = posVals.reduce((a, b) => a + b, 0) / positive.length;

  const variance =
    posVals.reduce((a, v) => a + Math.pow(v - avgPos, 2), 0) / positive.length;
  const consistency = clamp(100 - Math.sqrt(variance) * 1.6, 0, 100);

  const carry = clamp(((scores.di ?? 0) + (scores.body ?? 0) + (scores.resource ?? 0) + (scores.institution ?? 0)) / 4, 0, 100);
  const mainline = clamp((scores.shen ?? 0) * mainlineWeight, 0, 100);
  const noise = scores.noise ?? 0;

  const raw = (avgPos * 0.45) + (consistency * 0.25) + (carry * 0.15) + (mainline * 0.15) - noise * 0.4;
  const index = Math.round(clamp(raw, 0, 100));

  const aligned = positive.filter((d) => (scores[d.key] ?? 0) >= 65).map((d) => d.key);
  const conflicting = noise >= 55 ? [...aligned.filter((k) => (scores[k] ?? 0) < 80), "noise" as FoldDomainKey] : [];
  const missing = positive.filter((d) => (scores[d.key] ?? 0) < 35).map((d) => d.key);

  const verdict =
    index >= 75 ? "多域同向收束，事件具备显化条件。" :
    index >= 55 ? "部分域已对齐，需补足关键缺口。" :
    index >= 35 ? "折域松散，事件不具备稳定显化条件。" :
                  "折域薄弱，结构未形成，不宜推进。";

  return { index, aligned, conflicting, missing, scores, verdict };
}

export const DEFAULT_DOMAIN_SCORES: DomainScoresMap = {
  tian: 60, di: 55, ren: 50, shen: 70, feng: 55,
  resource: 50, body: 60, institution: 55, noise: 30,
};
