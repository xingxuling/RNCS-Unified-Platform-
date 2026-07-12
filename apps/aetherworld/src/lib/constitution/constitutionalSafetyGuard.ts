// System Constitution v0.2 — Safety Guard
import { CONSTITUTIONAL_SAFETY_RULES } from "@/constants/constitution/constitutionalSafetyRules";
import { getArticle } from "./constitutionRegistry";

export { CONSTITUTIONAL_SAFETY_RULES };

export type Role = "PUBLIC_USER" | "ADVANCED_USER" | "REAL_SUBJECT_USER" | "FULL60_USER" | "FOUNDER" | "SYSTEM";

export function canMutateArticle(articleId: string, role: Role): { allowed: boolean; reason?: string } {
  const a = getArticle(articleId);
  if (!a) return { allowed: false, reason: "条款不存在" };
  if (a.founderLocked && role !== "FOUNDER" && role !== "SYSTEM") {
    return { allowed: false, reason: "Founder Locked 条款" };
  }
  return { allowed: true };
}
