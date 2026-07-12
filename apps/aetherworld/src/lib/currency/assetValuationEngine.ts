import { getAssetType, type AssetTypeId } from "@/constants/currency/assetTypes";
import { normalizeAmount } from "./valueUnitEngine";

export interface AssetValueInput {
  assetId: string;
  assetType: AssetTypeId;
  completeness?: number;   // 0-10
  reusability?: number;    // 0-10
  userBenefit?: number;    // 0-10
  validationDepth?: number; // 0-10
  uniqueness?: number;     // 0-10
  safetyScore?: number;    // 0-10
  complexity?: number;     // 0-10
  exportability?: number;  // 0-10
  relatedModules?: number; // count
  isTemplate?: boolean;
}

export interface AssetValueResult {
  assetId: string;
  assetType: AssetTypeId;
  internalValueScore: number; // 0-100
  suggestedCredits: number;
  valueFactors: string[];
  riskFactors: string[];
  reusePotential: "LOW" | "MEDIUM" | "HIGH";
}

export function valuateAsset(input: AssetValueInput): AssetValueResult {
  const def = getAssetType(input.assetType);
  const base = def?.baseValue ?? 5;

  const dims = [
    { k: "completeness",     w: 1.2, v: pick(input.completeness, 5),     label: "完整度" },
    { k: "reusability",      w: 1.0, v: pick(input.reusability, 5),      label: "可复用性" },
    { k: "userBenefit",      w: 1.2, v: pick(input.userBenefit, 5),      label: "用户收益" },
    { k: "validationDepth",  w: 1.0, v: pick(input.validationDepth, 5),  label: "回验深度" },
    { k: "uniqueness",       w: 0.8, v: pick(input.uniqueness, 5),       label: "独特性" },
    { k: "safetyScore",      w: 1.0, v: pick(input.safetyScore, 8),      label: "安全性" },
    { k: "complexity",       w: 0.6, v: pick(input.complexity, 5),       label: "复杂度" },
    { k: "exportability",    w: 0.8, v: pick(input.exportability, 5),    label: "可导出性" },
  ];
  const weightSum = dims.reduce((a, d) => a + d.w, 0);
  const weighted = dims.reduce((a, d) => a + d.v * d.w, 0) / weightSum; // 0..10

  const moduleBoost = Math.min(2, Math.max(0, (input.relatedModules ?? 0) * 0.2));
  const templateBoost = input.isTemplate ? 1.2 : 0;
  const raw = (weighted + moduleBoost + templateBoost) * (base / 6); // 0..15ish
  const score = Math.round(Math.max(0, Math.min(100, raw * 8)));

  const suggestedCredits = normalizeAmount(score / 10);

  const valueFactors = dims.filter((d) => d.v >= 7).map((d) => `${d.label} ↑`);
  if (input.isTemplate) valueFactors.push("可作为模板");
  if ((input.relatedModules ?? 0) >= 3) valueFactors.push("关联模块多");

  const riskFactors: string[] = [];
  if ((input.safetyScore ?? 8) < 5) riskFactors.push("安全分偏低");
  if ((input.validationDepth ?? 5) < 3) riskFactors.push("缺少回验");
  if ((input.reusability ?? 5) < 3) riskFactors.push("复用价值低");

  const reusePotential: AssetValueResult["reusePotential"] =
    (input.reusability ?? 5) >= 7 ? "HIGH" : (input.reusability ?? 5) >= 4 ? "MEDIUM" : "LOW";

  return {
    assetId: input.assetId,
    assetType: input.assetType,
    internalValueScore: score,
    suggestedCredits,
    valueFactors,
    riskFactors,
    reusePotential,
  };
}

function pick(v: number | undefined, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(10, v));
}
