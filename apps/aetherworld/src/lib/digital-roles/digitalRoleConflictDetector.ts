import type { DigitalRoleType } from "@/constants/digital-roles/digitalRoleTypes";
import type { DigitalRoleConflictType } from "@/constants/digital-roles/digitalRoleConflictTypes";
import { CRITICAL_CONFLICTS } from "@/constants/digital-roles/digitalRoleConflictTypes";

export interface DigitalRoleConflict {
  conflictId: string;
  conflictType: DigitalRoleConflictType;
  involvedRoles: DigitalRoleType[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
  suggestedResolution: string;
}

export function detectRoleConflicts(roles: DigitalRoleType[]): DigitalRoleConflict[] {
  const conflicts: DigitalRoleConflict[] = [];
  const has = (r: DigitalRoleType) => roles.includes(r);

  const add = (type: DigitalRoleConflictType, involved: DigitalRoleType[], explanation: string, fix: string) => {
    conflicts.push({
      conflictId: `c-${type}-${Date.now().toString(36)}-${conflicts.length}`,
      conflictType: type,
      involvedRoles: involved,
      severity: CRITICAL_CONFLICTS.includes(type) ? "CRITICAL" : "MEDIUM",
      explanation,
      suggestedResolution: fix,
    });
  };

  if (has("DIGITAL_GROWTH_STRATEGIST") && !has("DIGITAL_GOVERNANCE_OFFICER")) {
    add("GROWTH_VS_GOVERNANCE", ["DIGITAL_GROWTH_STRATEGIST"], "增长无治理监督，存在虚假宣传风险。", "加入 DIGITAL_GOVERNANCE_OFFICER。");
  }
  if (has("DIGITAL_PROGRAMMER") && !has("DIGITAL_QA")) {
    add("PROGRAMMER_VS_QA", ["DIGITAL_PROGRAMMER"], "实现未被 QA 覆盖。", "加入 DIGITAL_QA。");
  }
  if (has("DIGITAL_FOUNDER") && !has("DIGITAL_QA")) {
    add("FOUNDER_VS_QA", ["DIGITAL_FOUNDER"], "创始人决策未被 QA 检查。", "加入 DIGITAL_QA。");
  }
  if (has("DIGITAL_GROWTH_STRATEGIST") && has("DIGITAL_RESEARCHER")) {
    // soft: ensure marketing waits for evidence
  }
  if (has("DIGITAL_PLANNER") && !has("DIGITAL_QA")) {
    add("CREATIVE_VS_CLM", ["DIGITAL_PLANNER"], "策划缺少 CLM/QA 复审。", "加入 DIGITAL_QA 或触发 CLM Review。");
  }
  return conflicts;
}
