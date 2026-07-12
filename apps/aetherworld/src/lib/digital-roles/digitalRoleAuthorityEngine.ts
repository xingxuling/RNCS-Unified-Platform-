import type { DigitalRoleType } from "@/constants/digital-roles/digitalRoleTypes";
import type { DigitalRoleAuthorityLevel } from "@/constants/digital-roles/digitalRoleAuthorityLevels";
import { getDigitalRoleByType } from "./digitalRoleRegistry";

export interface AuthorityCheckResult {
  allowed: boolean;
  reason: string;
  level: DigitalRoleAuthorityLevel | "UNKNOWN";
}

export function checkRoleAuthority(role: DigitalRoleType, requested: DigitalRoleAuthorityLevel, founderMode = false): AuthorityCheckResult {
  const r = getDigitalRoleByType(role);
  if (!r) return { allowed: false, reason: "角色不存在", level: "UNKNOWN" };
  if (requested === "FOUNDER_ONLY" && !founderMode) {
    return { allowed: false, reason: "Founder-only 权限不可在普通模式使用", level: r.authorityLevel };
  }
  if (requested === "QA_BLOCK" && role !== "DIGITAL_QA") {
    return { allowed: false, reason: "仅 Digital QA 拥有 QA_BLOCK 权限", level: r.authorityLevel };
  }
  if (requested === "GOVERNANCE_BLOCK" && role !== "DIGITAL_GOVERNANCE_OFFICER") {
    return { allowed: false, reason: "仅 Digital Governance Officer 拥有 GOVERNANCE_BLOCK 权限", level: r.authorityLevel };
  }
  if (role === "DIGITAL_FOUNDER" && requested === "GOVERNANCE_BLOCK") {
    return { allowed: false, reason: "数字创始人不能拥有治理阻断权", level: r.authorityLevel };
  }
  return { allowed: true, reason: "权限允许", level: r.authorityLevel };
}
