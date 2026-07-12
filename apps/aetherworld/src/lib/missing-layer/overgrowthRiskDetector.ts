import { scanSystemCapabilities } from "./systemCapabilityScanner";

export interface OvergrowthRiskResult {
  overgrowthScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  symptoms: string[];
  recommendedAction: "CONTINUE_EXPANSION" | "INTEGRATE" | "DOCUMENT" | "GOVERN" | "ARCHIVE" | "PAUSE_NEW_FEATURES";
}

export function detectOvergrowthRisk(): OvergrowthRiskResult {
  const cap = scanSystemCapabilities();
  const symptoms: string[] = [];
  let score = 0;
  if (cap.totalCapabilities > 15) { score += 30; symptoms.push("功能模块数量较多"); }
  if (cap.missingDocsCount > 5) { score += 20; symptoms.push("文档落后于功能"); }
  if (cap.missingQaCount > 5) { score += 15; symptoms.push("QA 覆盖不足"); }
  if (cap.partialCapabilities > 3) { score += 15; symptoms.push("半成品模块过多"); }
  score = Math.min(100, score);

  let riskLevel: OvergrowthRiskResult["riskLevel"] = "LOW";
  let recommendedAction: OvergrowthRiskResult["recommendedAction"] = "CONTINUE_EXPANSION";
  if (score >= 80) { riskLevel = "CRITICAL"; recommendedAction = "PAUSE_NEW_FEATURES"; }
  else if (score >= 60) { riskLevel = "HIGH"; recommendedAction = "INTEGRATE"; }
  else if (score >= 40) { riskLevel = "MEDIUM"; recommendedAction = "DOCUMENT"; }

  return { overgrowthScore: score, riskLevel, symptoms, recommendedAction };
}
