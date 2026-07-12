// UI Permission Guard
import { UI_MODULE_REGISTRY, type UIModuleDefinition } from "./uiModuleRegistry";
import { UI_SAFETY_RULES } from "@/constants/ui-update/uiSafetyRules";

export { UI_SAFETY_RULES };

export type UIAudience = "PUBLIC" | "ADVANCED" | "FOUNDER";
export type UISubjectMode = "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";

export interface UIPermissionIssue {
  ruleId: string;
  moduleId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  hideButton: boolean;
}

export function checkUIPermissions(
  audience: UIAudience,
  subjectMode: UISubjectMode,
  realSubjectConfigured: boolean,
): UIPermissionIssue[] {
  const issues: UIPermissionIssue[] = [];
  for (const m of UI_MODULE_REGISTRY) {
    // 普通用户看 Founder
    if (audience === "PUBLIC" && m.requiredUserMode === "FOUNDER" && m.sidebarVisible) {
      issues.push({ ruleId: "UI-S-001", moduleId: m.moduleId, severity: "CRITICAL",
        description: `普通用户暴露了 Founder 入口：${m.chineseName}`, hideButton: true });
    }
    // Demo → Full60 输出
    if (subjectMode === "DEMO" && m.requiredSubjectMode === "FULL_60") {
      issues.push({ ruleId: "UI-S-002", moduleId: m.moduleId, severity: "HIGH",
        description: `Demo 模式不应进入 Full60 模块：${m.chineseName}`, hideButton: true });
    }
    // Real 结果但未设置真实主体
    if (!realSubjectConfigured && m.requiredSubjectMode &&
        (m.requiredSubjectMode === "LIGHT_20" || m.requiredSubjectMode === "FULL_60")) {
      issues.push({ ruleId: "UI-S-003", moduleId: m.moduleId, severity: "HIGH",
        description: `未设置真实主体却显示 Real 模块：${m.chineseName}`, hideButton: true });
    }
  }
  return issues;
}

export function shouldHideModule(m: UIModuleDefinition, audience: UIAudience): boolean {
  if (audience === "PUBLIC" && m.requiredUserMode !== "PUBLIC") return true;
  if (audience === "ADVANCED" && m.requiredUserMode === "FOUNDER") return true;
  return false;
}
