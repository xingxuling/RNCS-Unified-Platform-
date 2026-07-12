// Constant Universe v0.2 — Safety Guard
import { CONSTANT_SAFETY_RULES } from "@/constants/constant-universe/constantSafetyRules";
import { getConstant } from "./constantRegistry";

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  ruleId?: string;
}

export type Role = "USER" | "ADVANCED" | "FOUNDER" | "SYSTEM";

export function canMutateConstant(constantId: string, role: Role): SafetyCheckResult {
  const c = getConstant(constantId);
  if (!c) return { allowed: false, reason: "常数不存在" };
  if (c.founderLocked && role !== "FOUNDER" && role !== "SYSTEM") {
    return { allowed: false, reason: "Founder Locked 常数禁止修改", ruleId: "FOUNDER_LOCKED_IMMUTABLE" };
  }
  if (c.category === "SAFETY" && role !== "SYSTEM") {
    return { allowed: false, reason: "Safety 常数仅系统可改", ruleId: "NO_USER_SAFETY_MUTATION" };
  }
  if (c.accessLevel === "FOUNDER_ONLY" && role !== "FOUNDER" && role !== "SYSTEM") {
    return { allowed: false, reason: "FOUNDER_ONLY 常数", ruleId: "FOUNDER_LOCKED_IMMUTABLE" };
  }
  return { allowed: true };
}

export function listSafetyRules() {
  return CONSTANT_SAFETY_RULES;
}
