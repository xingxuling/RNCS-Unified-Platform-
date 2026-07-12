import { FREE_INPUT_SAFETY_RULES } from "@/constants/free-input/freeInputSafetyRules";

export interface FreeInputSafetyResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  blockedActions: string[];
  requiredNotes: string[];
  safeResponseMode: "FULL" | "REDUCED" | "TEXT_ONLY";
}

const ORDER: FreeInputSafetyResult["riskLevel"][] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function runFreeInputSafety(text: string, subjectMode: string): FreeInputSafetyResult {
  const notes: string[] = [];
  let highest: FreeInputSafetyResult["riskLevel"] = "LOW";
  for (const rule of FREE_INPUT_SAFETY_RULES) {
    if (rule.match(text)) {
      notes.push(`【${rule.severity}】${rule.description}：${rule.note}`);
      if (ORDER.indexOf(rule.severity) > ORDER.indexOf(highest)) highest = rule.severity;
    }
  }
  if (subjectMode === "FULL_60") {
    notes.push("Full 60 隐私提示：所有结果仅在本地呈现，避免上传或截图分享。");
  }
  const blocked: string[] = [];
  let mode: FreeInputSafetyResult["safeResponseMode"] = "FULL";
  if (highest === "HIGH") { mode = "REDUCED"; blocked.push("EXPORT"); }
  if (highest === "CRITICAL") { mode = "TEXT_ONLY"; blocked.push("EXPORT", "GENERATE_ASSET", "HANDOFF_WRITE"); }
  return { riskLevel: highest, blockedActions: blocked, requiredNotes: notes, safeResponseMode: mode };
}
