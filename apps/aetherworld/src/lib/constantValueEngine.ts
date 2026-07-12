// 常数价值评估引擎（0–9 九维）
import { clamp } from "./math";

export type ConstantDim =
  | "sovereignty" | "relation" | "expression" | "structure" | "change"
  | "carry" | "depth" | "value" | "endgame";

export const CONSTANT_DIMS: { key: ConstantDim; name: string; digit: number }[] = [
  { key: "sovereignty", name: "主权性", digit: 1 },
  { key: "relation",    name: "关系性", digit: 2 },
  { key: "expression",  name: "表达性", digit: 3 },
  { key: "structure",   name: "结构性", digit: 4 },
  { key: "change",      name: "变动性", digit: 5 },
  { key: "carry",       name: "承载性", digit: 6 },
  { key: "depth",       name: "深读性", digit: 7 },
  { key: "value",       name: "价值性", digit: 8 },
  { key: "endgame",     name: "终局性", digit: 9 },
];

export type ConstantScores = Record<ConstantDim, number>; // 0-10

export interface ConstantValueResult {
  total: number;          // 0-100
  scores: ConstantScores;
  advantages: ConstantDim[];
  missing: ConstantDim[];
  risks: ConstantDim[];
  worthPursuing: boolean;
  recommendation: "进" | "守" | "转" | "断";
}

const WEIGHT: ConstantScores = {
  sovereignty: 1.2, relation: 1.0, expression: 1.0, structure: 1.1,
  change: 0.9, carry: 1.0, depth: 1.0, value: 1.2, endgame: 1.3,
};

export function evaluateConstantValue(s: ConstantScores): ConstantValueResult {
  let sum = 0, wsum = 0;
  CONSTANT_DIMS.forEach((d) => {
    sum += s[d.key] * WEIGHT[d.key];
    wsum += WEIGHT[d.key];
  });
  const total = Math.round(clamp((sum / wsum) * 10, 0, 100));

  const advantages = CONSTANT_DIMS.filter((d) => s[d.key] >= 8).map((d) => d.key);
  const missing = CONSTANT_DIMS.filter((d) => s[d.key] <= 3).map((d) => d.key);
  // 风险常数：变动性极高且承载性极低；或主权与终局都低
  const risks: ConstantDim[] = [];
  if (s.change >= 8 && s.carry <= 4) risks.push("change");
  if (s.sovereignty <= 3 && s.endgame <= 4) risks.push("sovereignty");
  if (s.value >= 8 && s.structure <= 3) risks.push("structure");

  const worthPursuing = total >= 65 && missing.length <= 2;

  let recommendation: ConstantValueResult["recommendation"] = "守";
  if (total >= 75 && advantages.length >= 3) recommendation = "进";
  else if (total >= 55 && missing.length >= 3) recommendation = "转";
  else if (total < 40) recommendation = "断";

  return { total, scores: s, advantages, missing, risks, worthPursuing, recommendation };
}

export const DEFAULT_CONSTANT_SCORES: ConstantScores = {
  sovereignty: 7, relation: 6, expression: 7, structure: 7, change: 6,
  carry: 6, depth: 7, value: 7, endgame: 7,
};
