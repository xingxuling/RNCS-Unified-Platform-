import type { SubjectModeId } from "@/constants/subject/subjectModes";
import { getActiveSubjectProfile } from "./activeSubjectModeResolver";

export interface PrivacyCheckResult {
  allowed: boolean;
  warnings: string[];
  requiresConfirm: boolean;
}

export function guardExport(target: "LIGHT20" | "FULL60" | "FOUNDER"): PrivacyCheckResult {
  const profile = getActiveSubjectProfile();
  const warnings: string[] = [];
  let requiresConfirm = false;

  if (target === "FULL60" || profile.subjectMode === "FULL_60") {
    warnings.push("Full60 是完整主体数列，导出前请二次确认。不会自动上传。");
    requiresConfirm = true;
  }
  if (target === "FOUNDER") {
    warnings.push("Founder 数据受保护，导出需 Founder 权限。");
    requiresConfirm = true;
  }
  return { allowed: true, warnings, requiresConfirm };
}

export function guardUpload(mode: SubjectModeId): PrivacyCheckResult {
  if (mode === "FULL_60" || mode === "FOUNDER") {
    return {
      allowed: false,
      warnings: ["Full60 / Founder 数据禁止自动上传。"],
      requiresConfirm: true,
    };
  }
  return { allowed: true, warnings: [], requiresConfirm: false };
}
