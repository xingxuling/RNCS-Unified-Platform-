// 安全边界规则 · 按页面 / 关键词判断风险等级与文案

import type { RiskLevel, CurrentPage } from "./manualGuidanceRules";
import type { SubjectSequenceMode } from "./subjectSequenceModes";

export interface SafetyBoundaryCopy {
  level: RiskLevel;
  title: string;
  message: string;
}

export const SAFETY_BOUNDARY_COPY: Record<RiskLevel, SafetyBoundaryCopy> = {
  LOW: {
    level: "LOW",
    title: "结构参考 · 不构成专业建议",
    message:
      "本结果用于结构参考与回验，不构成医疗、法律、金融、投资或心理诊断建议。",
  },
  MEDIUM: {
    level: "MEDIUM",
    title: "请结合现实信息使用",
    message:
      "请勿将本结果作为重大决策的唯一依据。建议结合现实信息、专业意见与回验结果共同判断。",
  },
  HIGH: {
    level: "HIGH",
    title: "高敏感内容 · 严格边界",
    message:
      "当前内容涉及真实主体、高风险判断或内测发布边界。请确认你理解：本系统不提供医疗、法律、金融、投资或心理诊断建议，预测结果不是绝对未来。",
  },
};

/** 需要默认显示安全边界 banner 的页面 */
export const SAFETY_REQUIRED_PAGES: CurrentPage[] = [
  "Prediction Detail",
  "Real Subject",
  "Beta Launch",
  "Version Iteration",
  "Prompt Forge",
  "Product Vitality",
  "Geo Analysis",
];

/** 风险关键词 → 至少 MEDIUM */
export const MEDIUM_KEYWORDS = [
  "financial value",
  "health recovery",
  "full 60",
  "beta launch",
  "release",
  "legal",
  "investment",
  "medical",
  "real subject",
];

/**
 * 根据页面、主体模式、关键词、是否已定数 计算安全边界等级。
 */
export function computeSafetyLevel(input: {
  page: CurrentPage;
  subjectMode: SubjectSequenceMode;
  keywords?: string[];
  determinationLocked?: boolean;
}): RiskLevel {
  const { page, subjectMode, keywords = [], determinationLocked } = input;

  // Full 60 + Prediction Detail + 定数已定 → HIGH
  if (subjectMode === "FULL_60" && page === "Prediction Detail" && determinationLocked) {
    return "HIGH";
  }

  // Full 60 主体本身就是高敏
  if (subjectMode === "FULL_60" && (page === "Real Subject" || page === "Prediction Detail")) {
    return "HIGH";
  }

  // 默认页面安全等级
  if (page === "Beta Launch" || page === "Version Iteration") return "HIGH";
  if (SAFETY_REQUIRED_PAGES.includes(page)) return "MEDIUM";

  // 关键词触发
  const hay = (keywords.join(" ") + " " + page).toLowerCase();
  if (MEDIUM_KEYWORDS.some((k) => hay.includes(k))) return "MEDIUM";

  return "LOW";
}
