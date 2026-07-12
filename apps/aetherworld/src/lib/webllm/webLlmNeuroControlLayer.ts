import { WEB_LLM_NEURO_CONTROL_PROFILES, DEFAULT_NEURO_CONTROL_PROFILE_ID, type NeuroControlProfile } from "@/constants/webllm/webLlmNeuroControlProfiles";

export function listNeuroProfiles(): NeuroControlProfile[] {
  return WEB_LLM_NEURO_CONTROL_PROFILES;
}

export function getNeuroProfile(id: string): NeuroControlProfile {
  return WEB_LLM_NEURO_CONTROL_PROFILES.find((p) => p.profileId === id)
    ?? WEB_LLM_NEURO_CONTROL_PROFILES.find((p) => p.profileId === DEFAULT_NEURO_CONTROL_PROFILE_ID)!;
}

export interface NeuroControlReport {
  profileId: string;
  driftScore: number;
  consistencyScore: number;
  detailScore: number;
  executiveGateScore: number;
  predictionErrorScore: number;
  status: "PASS" | "WARN" | "FAIL";
  notes: string[];
}

export function applyNeuroControl(profileId: string, output: string, taskHint: string): NeuroControlReport {
  const p = getNeuroProfile(profileId);
  // Heuristic scores from output text
  const len = output.length;
  const hasJsonish = /[{}\[\]]/.test(output);
  const tooShort = len < 30;
  const tooLong = len > 6000;
  const driftScore = taskHint && !output.toLowerCase().includes((taskHint.split(/\s+/)[0] || "").toLowerCase()) ? 0.5 : 0.1;
  const consistencyScore = tooShort ? 0.4 : 0.8;
  const detailScore = hasJsonish ? 0.85 : 0.6;
  const executiveGateScore = tooLong ? 0.4 : 0.8;
  const predictionErrorScore = Math.max(0, 1 - driftScore);
  const fails = [
    driftScore > p.predictionErrorSensitivity ? "上下文漂移高" : "",
    consistencyScore < p.consistencyThreshold * 0.7 ? "一致性偏低" : "",
    detailScore < p.localDetailFocus * 0.6 ? "细节不足" : "",
  ].filter(Boolean);
  const status: NeuroControlReport["status"] = fails.length >= 2 ? "FAIL" : fails.length === 1 ? "WARN" : "PASS";
  return {
    profileId: p.profileId,
    driftScore, consistencyScore, detailScore, executiveGateScore, predictionErrorScore,
    status,
    notes: fails.length ? fails : ["神经启发控制层未发现重大问题。"],
  };
}
