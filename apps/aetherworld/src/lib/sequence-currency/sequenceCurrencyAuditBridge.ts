// Calendar / Social / QA / Bug Audit → 数列货币系统计量桥。
import { recordContribution } from "@/lib/currency/sequenceCurrencyEngine";
import { isFounderActive } from "@/lib/founderCalculus";

function userMode() {
  return isFounderActive() ? ("FOUNDER" as const) : ("LIGHT_20" as const);
}

export interface CalendarTriggerCurrencyInput {
  triggerType: string;
  targetModule?: string;
  scheduledAt?: string;
  executedAt?: string;
  resultStatus?: "OK" | "FAIL" | "SKIPPED";
}

export function recordCalendarTriggerCurrencyEvent(input: CalendarTriggerCurrencyInput) {
  try {
    return recordContribution({
      contributionType: "COMPLETE_VIRTUAL_LIFE_TASK",
      userMode: userMode(),
      qualityScore: 5,
      usefulnessScore: 5,
      validationScore: 5,
      complexityScore: 3,
      safetyScore: 8,
      description: `日历触发：${input.triggerType}${
        input.targetModule ? " → " + input.targetModule : ""
      } · 结果 ${input.resultStatus ?? "OK"}`,
      sourceEngine: "CalendarTrigger",
      sourceId: input.scheduledAt ?? new Date().toISOString(),
    });
  } catch {
    return undefined;
  }
}

export interface SocialPublishCurrencyInput {
  postId?: string;
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC" | "FOUNDER_ONLY";
  qaStatus?: "PASS" | "WARN" | "BLOCK";
  safetyStatus?: "PASS" | "WARN" | "BLOCK";
  auditId?: string;
}

export function recordSocialPublishCurrencyEvent(input: SocialPublishCurrencyInput) {
  const blocked = input.qaStatus === "BLOCK" || input.safetyStatus === "BLOCK";
  try {
    return recordContribution({
      contributionType: blocked ? "RUN_QA" : "PROVIDE_FEEDBACK",
      userMode: userMode(),
      qualityScore: blocked ? 3 : 5,
      usefulnessScore: blocked ? 2 : 5,
      validationScore: 4,
      complexityScore: 3,
      safetyScore: blocked ? 3 : input.safetyStatus === "WARN" ? 5 : 8,
      description: `社交发布：可见性 ${input.visibility} · QA ${input.qaStatus ?? "PASS"}${
        input.postId ? " · " + input.postId : ""
      }`,
      sourceEngine: "Social",
      sourceId: input.postId ?? input.auditId ?? "social",
    });
  } catch {
    return undefined;
  }
}

export interface QaAuditCurrencyInput {
  moduleName: string;
  checkCount: number;
  warnCount: number;
  failCount: number;
  blockedCount: number;
  auditId?: string;
}

export function recordQaAuditCurrencyEvent(input: QaAuditCurrencyInput) {
  const safety = input.blockedCount > 0 ? 4 : input.failCount > 0 ? 5 : 8;
  try {
    return recordContribution({
      contributionType: input.failCount > 0 || input.blockedCount > 0 ? "FIX_BUG" : "RUN_QA",
      userMode: userMode(),
      qualityScore: 5,
      usefulnessScore: 6,
      validationScore: 6,
      complexityScore: Math.min(10, 3 + Math.log2(Math.max(1, input.checkCount))),
      safetyScore: safety,
      description: `QA / Bug Audit：${input.moduleName} · 检查 ${input.checkCount}，警告 ${input.warnCount}，失败 ${input.failCount}，阻断 ${input.blockedCount}`,
      sourceEngine: "BugAudit",
      sourceId: input.auditId ?? input.moduleName,
    });
  } catch {
    return undefined;
  }
}
