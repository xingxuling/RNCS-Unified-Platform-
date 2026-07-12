// 共振锁定引擎
import { clamp, strHash } from "./math";
import type { SubjectModel } from "./types";

export type ResonanceType = "same" | "compensation" | "conflict" | "low";

export interface ResonanceInput {
  objectName: string;        // 人名 / 项目 / 公司 / 地点
  date?: string;             // 可选时间窗口
  fieldSupport: number;      // 0-10
  feedbackDirection: number; // -10..10 反馈方向
  mainlineLegitimacy: number;// 0-10
  noise: number;             // 0-10
}

export interface ResonanceResult {
  objectName: string;
  objectDigits: number[];    // 5 位
  subjectAvg: number[];      // 5 位（取数列均值）
  similarity: number;        // 0-100
  compensation: number;      // 0-100
  conflict: number;          // 0-100
  index: number;             // 锁定指数 0-100
  type: ResonanceType;
  formsReality: boolean;
  missing: string[];         // 缺失补偿项
  conflicts: string[];
  action: string;
}

function nameToDigits(name: string): number[] {
  const h = strHash(name || "anonymous").toString().padStart(10, "0");
  return [0,1,2,3,4].map((i) => parseInt(h[i * 2], 10) % 10);
}

function avgDigits(subject: SubjectModel): number[] {
  const acc = [0,0,0,0,0];
  subject.digits.forEach((row) => row.forEach((v, i) => { acc[i] += v; }));
  return acc.map((s) => Math.round(s / subject.digits.length));
}

const POSITION_NAME = ["主权(1)","关系(2)","表达(3)","结构(4)","变局(5)"];

export function lockResonance(subject: SubjectModel, i: ResonanceInput): ResonanceResult {
  const o = nameToDigits(i.objectName);
  const s = avgDigits(subject);

  let same = 0, comp = 0, conf = 0;
  const missing: string[] = [];
  const conflicts: string[] = [];

  for (let k = 0; k < 5; k++) {
    const diff = Math.abs(o[k] - s[k]);
    if (diff <= 1) same += 20;
    // 补偿：主体此位很弱(<=3)且对象很强(>=6)
    if (s[k] <= 3 && o[k] >= 6) { comp += 18; missing.push(POSITION_NAME[k] + " 由对象补足"); }
    // 冲突：主体此位很强且对象同样强但方向不同(对 1/5/9 视为高能位)
    if (s[k] >= 7 && o[k] >= 7 && (o[k] + s[k]) % 2 === 1) {
      conf += 14;
      conflicts.push(POSITION_NAME[k] + " 双方都强 → 拉扯");
    }
  }
  const similarity = clamp(same, 0, 100);
  const compensation = clamp(comp, 0, 100);
  const conflict = clamp(conf, 0, 100);

  const S = similarity / 100, O = (10 - 0) / 10;
  const C = compensation / 100;
  const T = i.date ? 1 : 0.85;
  const F = i.fieldSupport / 10;
  const D = (i.feedbackDirection + 10) / 20;
  const M = i.mainlineLegitimacy / 10;
  const N = Math.max(0.2, i.noise / 10);

  const raw = (S + 0.2) * (O) * (C + 0.3) * T * (F + 0.2) * (D + 0.2) * (M + 0.2) / N;
  const index = Math.round(clamp(raw * 55, 0, 100));

  let type: ResonanceType = "low";
  if (similarity >= 60 && compensation < 40 && conflict < 40) type = "same";
  else if (compensation >= 45) type = "compensation";
  else if (conflict >= 40) type = "conflict";

  const formsReality = index >= 60 && F >= 0.5 && D >= 0.45 && M >= 0.4;

  const action =
    type === "compensation" && formsReality ? "可建立长期结构（合作 / 关键关系）。" :
    type === "same" && formsReality ? "可快速启动，但需补差异化以避免同质化消耗。" :
    type === "conflict" ? "吸引强但消耗大，需明确边界后再推进。" :
    "更多是感觉，不构成现实事件，暂不投入承诺。";

  return {
    objectName: i.objectName, objectDigits: o, subjectAvg: s,
    similarity, compensation, conflict, index, type,
    formsReality, missing, conflicts, action,
  };
}
