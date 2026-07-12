import type { SubjectModeId } from "@/constants/subject/subjectModes";
import {
  buildProfile,
  getProfileStatus,
  getStoredMode,
  isFounderEnabled,
  setStoredMode,
  type ActiveSubjectProfile,
} from "./subjectProfileStore";

export interface SubjectModeResolution {
  resolvedMode: SubjectModeId;
  reason: string;
  warnings: string[];
  requiredAction?: string;
}

export function resolveActiveMode(): SubjectModeResolution {
  const stored = getStoredMode();
  const status = getProfileStatus();
  const founder = isFounderEnabled();
  const warnings: string[] = [];

  // Respect explicit user choice
  if (stored) {
    if (stored === "FULL_60" && !status.hasFull60) {
      warnings.push("已选择 Full60，但本地尚未保存 60 组数列，已自动回退。");
    } else if (stored === "LIGHT_20" && !status.hasLight20 && !status.hasFull60) {
      warnings.push("已选择 Light20，但本地尚未保存 20 组数列，已自动回退。");
    } else if (stored === "FOUNDER" && (!founder || !status.hasFull60)) {
      warnings.push("Founder 模式需要已开启 Founder 权限 + Full60 数据。");
    } else {
      return { resolvedMode: stored, reason: "用户上次选择", warnings };
    }
  }

  if (founder && status.hasFull60) return { resolvedMode: "FOUNDER", reason: "Founder + Full60 已就绪", warnings };
  if (status.hasFull60) return { resolvedMode: "FULL_60", reason: "已检测到 Full60", warnings };
  if (status.hasLight20) return { resolvedMode: "LIGHT_20", reason: "已检测到 Light20", warnings };

  return {
    resolvedMode: "DEMO",
    reason: "未检测到真实主体数据",
    warnings: [...warnings, "当前为 Demo 演示模式，结果不会基于你的真实主体数列。"],
    requiredAction: "输入 Light20 或 Full60 以启用真实主体模式。",
  };
}

export function getActiveSubjectProfile(): ActiveSubjectProfile {
  return buildProfile(resolveActiveMode().resolvedMode);
}

export function switchSubjectMode(mode: SubjectModeId): SubjectModeResolution {
  setStoredMode(mode);
  return resolveActiveMode();
}
