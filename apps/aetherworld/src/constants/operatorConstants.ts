// 常数宇宙 v1.0 · 乘除算子常数 (1–10)
import type { DomainId } from "./fiveDomainConstants";

export interface OperatorConstant {
  operator: string; // ×1 ÷5 ...
  kind: "MULTIPLY" | "DIVIDE";
  level: number; // 1-10
  name: string;
  effectDescription: string;
  affectedDomain: DomainId | "ALL";
  risk: string;
  example: string;
}

const MUL_NAMES = [
  "保持原样", "关系放大", "表达放大", "结构放大", "变局放大",
  "承载放大", "深读放大", "资源放大", "终局放大", "极限放大 / 系统级触发",
];
const DIV_NAMES = [
  "不削弱", "关系削弱", "表达削弱", "规则阻断", "变局削弱 / 触发失败",
  "承载不足", "信息不透明", "资源不足", "主线不支持", "系统性压制",
];
const DOMAIN_MAP: (DomainId | "ALL")[] = [
  "ALL", "HUMAN", "WIND", "EARTH", "WIND", "EARTH", "SPIRIT", "EARTH", "SPIRIT", "ALL",
];

export const MULTIPLY_OPERATORS: OperatorConstant[] = MUL_NAMES.map((n, i) => ({
  operator: `×${i + 1}`,
  kind: "MULTIPLY",
  level: i + 1,
  name: n,
  effectDescription: `按 ${i + 1} 倍放大对应维度的信号强度。`,
  affectedDomain: DOMAIN_MAP[i],
  risk: i >= 8 ? "极限放大可能造成结构过载或反噬" : "放大过头会失真",
  example: `用 ×${i + 1} 来放大「${n}」`,
}));

export const DIVIDE_OPERATORS: OperatorConstant[] = DIV_NAMES.map((n, i) => ({
  operator: `÷${i + 1}`,
  kind: "DIVIDE",
  level: i + 1,
  name: n,
  effectDescription: `按 ${i + 1} 倍削弱对应维度的信号强度。`,
  affectedDomain: DOMAIN_MAP[i],
  risk: i >= 8 ? "系统级压制可能导致信号完全消失" : "削弱过头会漏掉真实信号",
  example: `用 ÷${i + 1} 来削弱「${n}」`,
}));

export const OPERATOR_CONSTANTS = [...MULTIPLY_OPERATORS, ...DIVIDE_OPERATORS];

// 兼容旧版 /constants 页面使用的 OPERATORS 结构
export interface LegacyOperator {
  n: number;
  multiplyMeaning: string;
  divideMeaning: string;
}
export const OPERATORS: LegacyOperator[] = MULTIPLY_OPERATORS.map((m, i) => ({
  n: m.level,
  multiplyMeaning: m.name,
  divideMeaning: DIVIDE_OPERATORS[i].name,
}));
