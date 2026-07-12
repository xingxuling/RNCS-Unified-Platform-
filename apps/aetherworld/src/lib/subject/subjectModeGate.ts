import { SUBJECT_MODES, type SubjectModeId } from "@/constants/subject/subjectModes";
import { getActiveSubjectProfile } from "./activeSubjectModeResolver";

export interface GateDecision {
  allowed: boolean;
  currentMode: SubjectModeId;
  reason: string;
  suggestion?: string;
}

export function checkGate(opts: { requiresRealSubject?: boolean; requireFounder?: boolean }): GateDecision {
  const profile = getActiveSubjectProfile();
  if (opts.requireFounder && profile.subjectMode !== "FOUNDER") {
    return {
      allowed: false,
      currentMode: profile.subjectMode,
      reason: "该功能需要 Founder 主体模式。",
      suggestion: "前往真实主体设置启用 Founder。",
    };
  }
  if (opts.requiresRealSubject && !SUBJECT_MODES[profile.subjectMode].requiresRealSubject) {
    return {
      allowed: false,
      currentMode: profile.subjectMode,
      reason: "该功能需要真实主体数列才能生成深度个人化结果。",
      suggestion: "前往真实主体设置输入 Light20 或 Full60。",
    };
  }
  return { allowed: true, currentMode: profile.subjectMode, reason: "通过主体模式校验。" };
}
