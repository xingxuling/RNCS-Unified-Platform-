import { NARRATIVE_SAFETY_RULES, NARRATIVE_DISCLAIMER } from "@/constants/narrative/narrativeSafetyRules";

export interface NarrativeSafetyIssue {
  ruleId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  suggestion: string;
}

export interface NarrativeSafetyReport {
  ok: boolean;
  issues: NarrativeSafetyIssue[];
  disclaimer: string[];
}

const DANGEROUS = /(自残|自杀|爆炸物配方|制毒|制枪|教唆暴力|怎么杀)/;
const VIRAL_PROMISE = /(一定爆火|百分百推荐|必签约|绝对火)/;
const REAL_AS_GOD = /(现实中的[^\n，。]{0,8}是神|你就是真神|你拥有现实神力)/;
const VIRTUAL_AS_REAL = /(虚拟生活就是现实|可以代替现实|无需考虑现实)/;

export function checkNarrativeSafety(text: string, opts?: { platformClaimed?: string; platformConfigured?: string }): NarrativeSafetyReport {
  const issues: NarrativeSafetyIssue[] = [];
  if (DANGEROUS.test(text)) issues.push({ ruleId: "NO_DANGEROUS_ADVICE", severity: "CRITICAL", message: "包含危险现实行动相关内容", suggestion: "移除并改用安全描述" });
  if (VIRAL_PROMISE.test(text)) issues.push({ ruleId: "NO_VIRAL_PROMISE", severity: "MEDIUM", message: "包含『一定爆火 / 必签约』承诺", suggestion: "改为『可能更适配 X 平台调性』" });
  if (REAL_AS_GOD.test(text)) issues.push({ ruleId: "NO_DEIFICATION", severity: "HIGH", message: "将现实人物神化为绝对身份", suggestion: "保留隐喻、避免绝对化" });
  if (VIRTUAL_AS_REAL.test(text)) issues.push({ ruleId: "VIRTUAL_NOT_REAL", severity: "HIGH", message: "把虚拟生活写成现实替代", suggestion: "加入现实锚点提示" });
  if (opts?.platformClaimed && !opts.platformConfigured) {
    issues.push({ ruleId: "PLATFORM_MISMATCH", severity: "MEDIUM", message: `声称适合 ${opts.platformClaimed} 但未做平台适配`, suggestion: "在平台适配器中选择目标平台" });
  }
  return { ok: !issues.some(i => i.severity === "CRITICAL"), issues, disclaimer: NARRATIVE_DISCLAIMER };
}

export { NARRATIVE_SAFETY_RULES };
