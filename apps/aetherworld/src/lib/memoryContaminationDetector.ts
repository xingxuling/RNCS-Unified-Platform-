import type { RecallFragment } from "./pastLifeRecallCalculus";
import { RECALL_RISK_TYPES } from "@/constants/recallRiskTypes";

export interface ContaminationRisk {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  possibleSources: string[];
  explanation: string;
  recommendedAction: string;
}

export function detectMemoryContamination(f: RecallFragment): ContaminationRisk {
  const possible = new Set<string>(f.possibleExternalSources);
  if (f.imageIntensity >= 8 && f.culturalDistance <= 3) possible.add("MEDIA_CONTAMINATION");
  if (f.emotionalCharge >= 9 && f.narrativeCoherence <= 3) possible.add("EMOTIONAL_PROJECTION");
  if (/命定|必须|唯一|前世/.test(f.description)) possible.add("SELF_MYTHIFICATION");
  if (f.sourceContext === "CREATIVE_FLASH" && f.imageIntensity >= 8) possible.add("AI_IMAGE_CONTAMINATION");

  const labels = Array.from(possible).map(id => {
    const t = RECALL_RISK_TYPES.find(r => r.id === id);
    return t ? t.label : id;
  });
  const severityCount = Array.from(possible).map(id => RECALL_RISK_TYPES.find(r => r.id === id)?.severity ?? "LOW");
  const highs = severityCount.filter(s => s === "HIGH").length;
  const meds = severityCount.filter(s => s === "MEDIUM").length;
  const riskLevel: "LOW" | "MEDIUM" | "HIGH" = highs >= 1 ? "HIGH" : meds >= 2 ? "HIGH" : meds >= 1 ? "MEDIUM" : "LOW";

  const explanation = riskLevel === "HIGH"
    ? "高象征强度材料，可能受到外部内容或情绪影响，建议先记录，不下结论。"
    : riskLevel === "MEDIUM"
      ? "可能存在外部来源混入，建议在 2–4 周后再回看。"
      : "暂未检测到明显污染来源。";
  const recommendedAction = riskLevel === "HIGH"
    ? "不要表述为「前世记忆」，仅作为象征材料记录。"
    : "继续记录，观察重复性。";

  return { riskLevel, possibleSources: labels, explanation, recommendedAction };
}
